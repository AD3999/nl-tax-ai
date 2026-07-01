import logging
import requests as http_requests
import rest_framework.throttling
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from config.authentication import SoftJWTAuthentication
from .models import User, AccountantProfile
from .serializers import UserSerializer, RegisterSerializer, AccountantProfileSerializer
from .alerts import generate_alerts
from .actions import generate_actions

logger = logging.getLogger(__name__)


class HealthView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def get(self, request):
        import os
        from .push_utils import check_vapid_config
        bsn_key_set = bool(os.environ.get("BSN_ENCRYPTION_KEY", ""))
        return Response({
            "status":    "ok",
            "vapid":     check_vapid_config(),
            "bsn_ready": bsn_key_set,
        })


class AlertsView(APIView):
    """
    GET /api/users/alerts/?lang=en
    Returns proactive tax alerts derived from the user's intake profile.
    Works for authenticated users (reads from DB profile) and anonymous
    users if they POST a profile in the request body.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        lang = request.query_params.get("lang", "en")
        profile = None
        calc_result = {}

        if request.user.is_authenticated and request.user.intake_profile:
            profile = request.user.intake_profile
            # Run calculator silently
            try:
                from apps.calculator.engine import calculate
                calc_result = calculate(profile)
            except Exception:
                pass

        if not profile:
            return Response([])

        alerts = generate_alerts(profile, calc_result, lang)
        alerts += self._rule_change_alerts(lang)
        return Response(alerts)

    def _rule_change_alerts(self, lang: str) -> list:
        """Query DB for recently updated verified ZZP rules."""
        try:
            from django.utils import timezone
            from datetime import timedelta
            from apps.tax.models import TaxRule
            since = timezone.now() - timedelta(days=30)
            qs = TaxRule.objects.filter(verification_status="verified", is_active=True, updated_at__gte=since, year=2026)
            result = []
            for rule in qs[:5]:
                body_nl = rule.plain_nl[:200] if rule.plain_nl else ""
                body_en = rule.plain_en[:200] if rule.plain_en else ""
                body_fa = rule.plain_fa[:200] if rule.plain_fa else ""
                body = ({"nl": body_nl, "en": body_en, "fa": body_fa}).get(lang, body_en)
                result.append({
                    "id": f"rule-change-{rule.rule_id}",
                    "category": "rule_change",
                    "severity": "info",
                    "title": {
                        "nl": f"Regelwijziging: {rule.topic}",
                        "en": f"Rule updated: {rule.topic}",
                        "fa": f"قانون به‌روز شد: {rule.topic}",
                    }.get(lang, f"Rule updated: {rule.topic}"),
                    "body": body,
                    "action_label": {"nl": "Meer info", "en": "More info", "fa": "بیشتر"}.get(lang, "More info"),
                    "action_url": rule.source_url or "https://www.belastingdienst.nl",
                })
            return result
        except Exception:
            return []

    def post(self, request):
        """Accept profile in body for anonymous preview."""
        lang = request.data.get("lang", "en")
        profile = request.data.get("profile") or {}
        calc_result = {}
        if profile:
            try:
                from apps.calculator.engine import calculate
                calc_result = calculate(profile)
            except Exception:
                pass
        alerts = generate_alerts(profile, calc_result, lang)
        alerts += self._rule_change_alerts(lang)
        return Response(alerts)


class ActionsView(APIView):
    """
    GET /api/users/actions/?lang=en
    POST /api/users/actions/ { profile, lang }

    Returns proactive tax actions (concrete tasks) for the user's profile.
    Actions are distinct from alerts — they are tasks to complete, not notices.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def _run_calc(self, profile):
        if not profile:
            return {}
        try:
            from apps.calculator.engine import calculate
            return calculate(profile)
        except Exception:
            return {}

    def get(self, request):
        lang = request.query_params.get("lang", "en")
        if not (request.user.is_authenticated and request.user.intake_profile):
            return Response([])
        profile = request.user.intake_profile
        calc_result = self._run_calc(profile)
        return Response(generate_actions(profile, calc_result, lang))

    def post(self, request):
        lang = request.data.get("lang", "en")
        profile = request.data.get("profile") or {}
        calc_result = self._run_calc(profile)
        return Response(generate_actions(profile, calc_result, lang))


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [rest_framework.throttling.AnonRateThrottle]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "access":  str(refresh.access_token),
            "refresh": str(refresh),
            "user":    UserSerializer(user).data,
        }, status=201)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.conf import settings as django_settings
        user_type    = request.data.get("user_type", "zzp")
        access_token = request.data.get("access_token")
        code         = request.data.get("code")
        code_verifier = request.data.get("code_verifier")
        redirect_uri = request.data.get("redirect_uri")

        # PKCE authorization-code flow (preferred — implicit flow is deprecated)
        if code and code_verifier and redirect_uri:
            token_resp = http_requests.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": django_settings.GOOGLE_CLIENT_ID,
                    "client_secret": django_settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                    "code_verifier": code_verifier,
                },
                timeout=10,
            )
            if token_resp.status_code != 200:
                return Response({"error": "Failed to exchange Google auth code"}, status=400)
            access_token = token_resp.json().get("access_token")

        if not access_token:
            return Response({"error": "No access token provided"}, status=400)

        # Verify token and fetch user info from Google
        resp = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if resp.status_code != 200:
            return Response({"error": "Invalid Google token"}, status=400)

        info = resp.json()
        email = info.get("email")
        if not email:
            return Response({"error": "Google account has no email"}, status=400)

        # Get or create user — filter().first() handles the edge case where
        # duplicate email rows exist (MultipleObjectsReturned would crash .get())
        user = User.objects.filter(email__iexact=email).first()
        if user:
            created = False
        else:
            # Ensure username is unique — try base, then base_g, then base_g2, etc.
            base = email.split("@")[0]
            username = email
            if User.objects.filter(username=username).exists():
                suffix = 1
                candidate = f"{base}_g"
                while User.objects.filter(username=candidate).exists():
                    candidate = f"{base}_g{suffix}"
                    suffix += 1
                username = candidate
            user = User.objects.create_user(
                email=email,
                username=username,
                password=None,
                user_type=user_type,
            )
            created = True

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_new": created,
            "user": UserSerializer(user).data,
        })


class NotificationPrefsView(APIView):
    """
    GET  /api/users/notifications/ — return current notification preferences
    PATCH /api/users/notifications/ — update preferences

    Part of the Smart Calendar / Reminder Engine.
    Architecture designed so email/WhatsApp/SMS channels can be enabled
    by setting the respective boolean and wiring the send task in tasks.py.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _get_or_create(self, user):
        from .models import NotificationPreference
        prefs, _ = NotificationPreference.objects.get_or_create(user=user)
        return prefs

    def get(self, request):
        prefs = self._get_or_create(request.user)
        return Response({
            "inapp_enabled":       prefs.inapp_enabled,
            "email_enabled":       prefs.email_enabled,
            "email_btw":           prefs.email_btw,
            "email_ib":            prefs.email_ib,
            "email_reserve":       prefs.email_reserve,
            "email_rule_change":   prefs.email_rule_change,
            "whatsapp_enabled":    prefs.whatsapp_enabled,
            "sms_enabled":         prefs.sms_enabled,
            "calendar_sync":       prefs.calendar_sync,
            "reminder_lead_days":  prefs.reminder_lead_days,
        })

    def patch(self, request):
        prefs = self._get_or_create(request.user)
        allowed = [
            "inapp_enabled", "email_enabled", "email_btw", "email_ib",
            "email_reserve", "email_rule_change", "whatsapp_enabled",
            "sms_enabled", "calendar_sync", "reminder_lead_days",
        ]
        for field in allowed:
            if field in request.data:
                setattr(prefs, field, request.data[field])
        prefs.save()
        return Response({"status": "updated"})


class YearSnapshotView(APIView):
    """
    GET  /api/users/snapshots/          — list the user's year snapshots
    POST /api/users/snapshots/          — create a new snapshot
    GET  /api/users/snapshots/<year>/   — retrieve a specific year snapshot

    Part of the Future Memory Foundation.
    Snapshots capture the full profile + calc result at year-end.
    Used for: multi-year comparisons, carryovers, accountant review.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, year: int | None = None):
        from .models import TaxYearSnapshot
        qs = TaxYearSnapshot.objects.filter(user=request.user)
        if year:
            qs = qs.filter(tax_year=year)
        snapshots = [
            {
                "id": s.id,
                "tax_year": s.tax_year,
                "source": s.source,
                "is_final": s.is_final,
                "notes": s.notes,
                "total_tax_due": s.calc_snapshot.get("result", {}).get("total_tax_due") if s.calc_snapshot else None,
                "effective_rate": s.calc_snapshot.get("result", {}).get("effective_rate") if s.calc_snapshot else None,
                "monthly_reserve": s.calc_snapshot.get("result", {}).get("monthly_reserve_needed") if s.calc_snapshot else None,
                "user_type": s.profile_snapshot.get("user_type") if s.profile_snapshot else None,
                "created_at": s.created_at.date().isoformat(),
            }
            for s in qs
        ]
        return Response(snapshots)

    def post(self, request):
        from .models import TaxYearSnapshot
        tax_year = request.data.get("tax_year", 2026)
        profile_snapshot = request.data.get("profile_snapshot") or (
            request.user.intake_profile or {}
        )
        calc_snapshot = request.data.get("calc_snapshot")
        if not calc_snapshot and profile_snapshot:
            try:
                from apps.calculator.engine import calculate
                calc_snapshot = calculate(profile_snapshot)
            except Exception:
                pass

        source = request.data.get("source", "user")
        is_final = bool(request.data.get("is_final", False))
        notes = request.data.get("notes", "")

        snapshot, created = TaxYearSnapshot.objects.update_or_create(
            user=request.user,
            tax_year=tax_year,
            is_final=is_final,
            defaults={
                "profile_snapshot": profile_snapshot,
                "calc_snapshot": calc_snapshot,
                "source": source,
                "notes": notes,
            },
        )
        return Response({
            "id": snapshot.id,
            "tax_year": snapshot.tax_year,
            "is_final": snapshot.is_final,
            "created": created,
            "total_tax_due": snapshot.calc_snapshot.get("result", {}).get("total_tax_due") if snapshot.calc_snapshot else None,
        }, status=201 if created else 200)


class ItemStatesView(APIView):
    """
    GET  /api/users/item-states/
         Returns { alerts: {id: {state, snoozed_until}}, actions: {id: {state, snoozed_until}} }

    POST /api/users/item-states/
         Body: { item_type: "alert"|"action", item_id: str, state: str, snoozed_until?: "YYYY-MM-DD"|null }
         Upserts a single state record. Returns the saved record.

    Authenticated users only. Anonymous users keep localStorage as their store.
    This endpoint is called:
      - on mount: GET to hydrate client state from server
      - on each dismiss/snooze/done change: POST to persist
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import UserItemState
        qs = UserItemState.objects.filter(user=request.user)
        result = {"alerts": {}, "actions": {}}
        for obj in qs:
            bucket = "alerts" if obj.item_type == "alert" else "actions"
            result[bucket][obj.item_id] = {
                "state": obj.state,
                "snoozed_until": obj.snoozed_until.isoformat() if obj.snoozed_until else None,
            }
        return Response(result)

    def post(self, request):
        from .models import UserItemState
        item_type = request.data.get("item_type")
        item_id   = request.data.get("item_id")
        state     = request.data.get("state", "open")
        snoozed_until = request.data.get("snoozed_until") or None

        if item_type not in ("alert", "action") or not item_id:
            return Response({"error": "item_type and item_id required"}, status=400)
        if state not in ("open", "done", "dismissed", "snoozed"):
            return Response({"error": "invalid state"}, status=400)

        obj, _ = UserItemState.objects.update_or_create(
            user=request.user,
            item_type=item_type,
            item_id=item_id,
            defaults={"state": state, "snoozed_until": snoozed_until},
        )
        return Response({
            "item_type": obj.item_type,
            "item_id": obj.item_id,
            "state": obj.state,
            "snoozed_until": obj.snoozed_until.isoformat() if obj.snoozed_until else None,
        })


class PDFReportView(APIView):
    """
    GET /api/users/report/?lang=en
    Generates and streams a PDF Tax Health Report for the authenticated user.
    Also works for anonymous users if a profile is POSTed in the body (preview mode).
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.http import HttpResponse
        lang = request.query_params.get("lang", "en")
        profile = None
        calc_result = {}
        alerts = []

        if request.user.is_authenticated and request.user.intake_profile:
            profile = request.user.intake_profile
        if not profile:
            return Response({"error": "No profile found. Complete your tax profile first."}, status=400)

        try:
            from apps.calculator.engine import calculate
            calc_result = calculate(profile)
        except Exception:
            pass

        try:
            from .alerts import generate_alerts
            alerts = generate_alerts(profile, calc_result, lang)
        except Exception:
            pass

        try:
            from .pdf_report import generate_report
            pdf_bytes = generate_report(
                user=request.user if request.user.is_authenticated else None,
                profile=profile,
                calc_result=calc_result,
                alerts=alerts,
                lang=lang,
            )
        except Exception as e:
            return Response({"error": f"PDF generation failed: {e}"}, status=500)

        name = "taxwijs-report-2026"
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{name}.pdf"'
        response["Content-Length"] = len(pdf_bytes)
        return response

    def post(self, request):
        """Anonymous preview — accepts profile in body."""
        from django.http import HttpResponse
        lang = request.data.get("lang", "en")
        profile = request.data.get("profile") or {}
        if not profile:
            return Response({"error": "profile required"}, status=400)
        calc_result, alerts = {}, []
        try:
            from apps.calculator.engine import calculate
            calc_result = calculate(profile)
        except Exception:
            pass
        try:
            from .alerts import generate_alerts
            alerts = generate_alerts(profile, calc_result, lang)
        except Exception:
            pass
        try:
            from .pdf_report import generate_report
            pdf_bytes = generate_report(user=None, profile=profile, calc_result=calc_result, alerts=alerts, lang=lang)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="taxwijs-report-2026.pdf"'
        return response


class EmailCaptureView(APIView):
    """
    POST /api/users/email-capture/
    Stores an anonymous email lead. No auth required.
    Body: { email, user_type?, source_page? }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .models import EmailCapture
        email = request.data.get("email", "").strip()
        if not email or "@" not in email:
            return Response({"error": "valid email required"}, status=400)
        EmailCapture.objects.get_or_create(
            email=email,
            defaults={
                "user_type": request.data.get("user_type", ""),
                "source_page": request.data.get("source_page", "landing"),
            },
        )
        return Response({"status": "ok"})


class RemindersView(APIView):
    """
    GET /api/users/reminders/?lang=en&days=60
    Returns upcoming TaxReminders relevant to this user's profile.
    Works for authenticated users (filters by user_type) and anonymous (returns all).
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .models import TaxReminder
        from datetime import date, timedelta
        lang = request.query_params.get("lang", "en")
        days = int(request.query_params.get("days", 90))
        today = date.today()
        cutoff = today + timedelta(days=days)

        qs = TaxReminder.objects.filter(
            verification_status="verified",
            is_active=True,
            tax_year=2026,
            due_date__gte=today,
            due_date__lte=cutoff,
        )

        result = []
        for r in qs:
            days_until = (r.due_date - today).days
            result.append({
                "id": r.id,
                "title": r.title(lang),
                "description": r.description(lang),
                "category": r.category,
                "due_date": r.due_date.isoformat(),
                "days_until": days_until,
                "action_type": r.action_type,
                "source_url": r.source_url,
                "user_types": r.user_types,
                "reminder_offsets": r.reminder_offsets,
            })
        return Response(result)


class ChatHistoryView(APIView):
    """
    GET /api/chat/history/        — last 10 conversations with first question + count
    GET /api/chat/history/<id>/   — full message list for a conversation
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk=None):
        from apps.chat.models import Conversation, Message
        if pk:
            try:
                conv = Conversation.objects.get(pk=pk, user=request.user)
            except Conversation.DoesNotExist:
                return Response({"error": "not found"}, status=404)
            messages = [
                {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat()}
                for m in conv.messages.all()
            ]
            return Response({"id": conv.id, "summary": conv.summary, "messages": messages})

        convs = Conversation.objects.filter(user=request.user).order_by("-updated_at")[:10]
        result = []
        for c in convs:
            first_msg = c.messages.filter(role="user").first()
            result.append({
                "id": c.id,
                "summary": c.summary or (first_msg.content[:120] if first_msg else ""),
                "message_count": c.message_count,
                "language": c.language,
                "created_at": c.created_at.isoformat(),
                "updated_at": c.updated_at.isoformat(),
            })
        return Response(result)


class ICSCalendarView(APIView):
    """
    GET /api/users/calendar.ics
    Returns an iCal feed of all upcoming TaxReminders for this user.
    No auth required — anonymous users get generic reminders.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .models import TaxReminder
        from datetime import date, timedelta
        from django.http import HttpResponse
        today = date.today()
        cutoff = today + timedelta(days=366)

        qs = TaxReminder.objects.filter(
            verification_status="verified",
            is_active=True,
            tax_year=2026,
            due_date__gte=today,
            due_date__lte=cutoff,
        )

        lines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//TaxWijs//NL Tax Calendar 2026//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "X-WR-CALNAME:TaxWijs — Dutch Tax Calendar 2026",
            "X-WR-CALDESC:Dutch tax deadlines and reminders for 2026",
            "X-WR-TIMEZONE:Europe/Amsterdam",
        ]

        for r in qs:
            if user_type and r.user_types and user_type not in r.user_types:
                continue
            uid = f"taxwijs-{r.id}-2026@taxwijs.nl"
            dtstart = r.due_date.strftime("%Y%m%d")
            dtend = (r.due_date + timedelta(days=1)).strftime("%Y%m%d")
            summary = r.title_en.replace(",", "\\,").replace("\n", "\\n")
            description = r.description_en.replace(",", "\\,").replace("\n", "\\n")[:500]
            lines += [
                "BEGIN:VEVENT",
                f"UID:{uid}",
                f"DTSTART;VALUE=DATE:{dtstart}",
                f"DTEND;VALUE=DATE:{dtend}",
                f"SUMMARY:{summary}",
                f"DESCRIPTION:{description}",
                f"URL:{r.source_url or 'https://www.belastingdienst.nl'}",
                "STATUS:CONFIRMED",
                "BEGIN:VALARM",
                "TRIGGER:-P7D",
                "ACTION:DISPLAY",
                f"DESCRIPTION:Reminder: {summary} in 7 days",
                "END:VALARM",
                "BEGIN:VALARM",
                "TRIGGER:-P1D",
                "ACTION:DISPLAY",
                f"DESCRIPTION:Tomorrow: {summary}",
                "END:VALARM",
                "END:VEVENT",
            ]

        lines.append("END:VCALENDAR")
        content = "\r\n".join(lines)
        return HttpResponse(content, content_type="text/calendar; charset=utf-8")


class AccountantSetupView(APIView):
    """
    GET   /api/users/accountant/setup/   — retrieve AccountantProfile
    PATCH /api/users/accountant/setup/   — update AccountantProfile fields
    Creates the profile record if it doesn't exist yet (idempotent).
    Only accessible to users with role='accountant' or is_staff.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _check_role(self, user):
        return user.role == "accountant" or user.is_staff

    def get(self, request):
        if not self._check_role(request.user):
            return Response({"error": "Not an accountant account."}, status=403)
        profile, _ = AccountantProfile.objects.get_or_create(user=request.user)
        return Response(AccountantProfileSerializer(profile).data)

    def patch(self, request):
        if not self._check_role(request.user):
            return Response({"error": "Not an accountant account."}, status=403)
        profile, _ = AccountantProfile.objects.get_or_create(user=request.user)
        serializer = AccountantProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AccountantView(APIView):
    """
    GET  /api/users/accountant/clients/         — list accountant's clients
    POST /api/users/accountant/clients/         — add a client
    GET  /api/users/accountant/clients/<pk>/    — client alerts + reminders
    DELETE /api/users/accountant/clients/<pk>/  — remove client
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _get_profile(self, request):
        if request.user.role != "accountant" and not request.user.is_staff:
            return None
        profile, _ = AccountantProfile.objects.get_or_create(user=request.user)
        return profile

    def get(self, request, pk=None):
        from .models import AccountantClient, TaxReminder
        from datetime import date, timedelta
        profile = self._get_profile(request)
        if profile is None:
            return Response({"error": "Not an accountant account."}, status=403)

        if pk:
            try:
                link = AccountantClient.objects.get(pk=pk, accountant=profile)
            except AccountantClient.DoesNotExist:
                return Response({"error": "not found"}, status=404)
            client_user = link.client_user
            alerts, reminders = [], []
            if client_user and client_user.intake_profile:
                try:
                    from apps.calculator.engine import calculate
                    calc = calculate(client_user.intake_profile)
                    alerts = generate_alerts(client_user.intake_profile, calc, "en")
                except Exception:
                    pass
                today = date.today()
                cutoff = today + timedelta(days=60)
                for r in TaxReminder.objects.filter(verification_status="verified", is_active=True, due_date__gte=today, due_date__lte=cutoff):
                    reminders.append({"title": r.title_en, "due_date": r.due_date.isoformat(), "category": r.category})
            return Response({
                "id": link.id,
                "nickname": link.nickname,
                "notes": link.notes,
                "user_type": client_user.intake_profile.get("user_type") if client_user and client_user.intake_profile else None,
                "alerts": alerts[:5],
                "upcoming_reminders": reminders,
            })

        clients = profile.clients.select_related("client_user").all()
        return Response([
            {
                "id": c.id,
                "nickname": c.nickname or (c.client_user.email if c.client_user else "Unknown"),
                "user_type": c.client_user.intake_profile.get("user_type") if c.client_user and c.client_user.intake_profile else None,
                "alert_count": 0,
                "created_at": c.created_at.date().isoformat(),
            }
            for c in clients
        ])

    def post(self, request):
        from .models import AccountantClient
        profile = self._get_profile(request)
        if profile is None:
            return Response({"error": "Not an accountant account."}, status=403)
        nickname = request.data.get("nickname", "")
        client_email = request.data.get("email", "")
        notes = request.data.get("notes", "")
        client_user = None
        if client_email:
            try:
                client_user = User.objects.get(email__iexact=client_email)
            except User.DoesNotExist:
                pass
        link = AccountantClient.objects.create(accountant=profile, client_user=client_user, nickname=nickname, notes=notes)
        return Response({"id": link.id, "nickname": link.nickname}, status=201)

    def delete(self, request, pk=None):
        from .models import AccountantClient
        profile = self._get_profile(request)
        if profile is None:
            return Response({"error": "Not an accountant account."}, status=403)
        AccountantClient.objects.filter(pk=pk, accountant=profile).delete()
        return Response(status=204)


# ── Accountant Invitations ────────────────────────────────────────────────────

class AccountantInvitationsView(APIView):
    """
    DEPRECATED — use /api/portal/invitations/ instead.
    Kept for backward compatibility; redirects GET to portal invitation data.

    GET  /api/users/accountant/invitations/       — list sent invitations (legacy)
    POST /api/users/accountant/invitations/       — send a new invitation (legacy)
    DELETE /api/users/accountant/invitations/<pk>/ — cancel a pending invitation (legacy)
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def _get_accountant_profile(self, user):
        if user.role != "accountant" and not user.is_staff:
            return None
        return AccountantProfile.objects.filter(user=user).first()

    def get(self, request):
        profile = self._get_accountant_profile(request.user)
        if not profile:
            return Response({"error": "Not an accountant account."}, status=403)

        # Read from the canonical portal.Invitation model so both endpoints return consistent data
        from apps.portal.models import Invitation as PortalInvitation
        invs = PortalInvitation.objects.filter(sent_by=request.user).order_by("-created_at")
        return Response([
            {
                "id":            inv.id,
                "invited_email": inv.client_email,
                "status":        inv.status,
                "message":       inv.message,
                "client_name":   inv.client_name or None,
                "created_at":    inv.created_at.date().isoformat(),
                "updated_at":    inv.created_at.date().isoformat(),
            }
            for inv in invs
        ])

    def post(self, request):
        from .models import AccountantInvitation
        profile = self._get_accountant_profile(request.user)
        if not profile:
            return Response({"error": "Not an accountant account."}, status=403)

        email   = (request.data.get("email") or "").strip().lower()
        message = (request.data.get("message") or "").strip()

        if not email or "@" not in email:
            return Response({"error": "Valid email required."}, status=400)

        # Prevent duplicate pending invitations
        if AccountantInvitation.objects.filter(accountant=profile, invited_email=email, status="pending").exists():
            return Response({"error": "A pending invitation already exists for this email."}, status=400)

        # Link to existing user if already registered
        client_user = User.objects.filter(email__iexact=email).first()

        inv = AccountantInvitation.objects.create(
            accountant=profile,
            invited_email=email,
            client_user=client_user,
            message=message,
        )

        firm = profile.firm_name or request.user.get_full_name() or request.user.email

        # Push notification to client (if registered and has subscribed)
        if client_user:
            from .push_utils import send_push_notification
            send_push_notification(
                client_user,
                title="New accountant invitation",
                body=f"{firm} has invited you to connect on TaxWijs.",
                url="/dashboard",
            )

        return Response({
            "id":            inv.id,
            "invited_email": inv.invited_email,
            "status":        inv.status,
            "created_at":    inv.created_at.date().isoformat(),
        }, status=201)

    def delete(self, request, pk=None):
        from .models import AccountantInvitation
        profile = self._get_accountant_profile(request.user)
        if not profile:
            return Response({"error": "Not an accountant account."}, status=403)
        AccountantInvitation.objects.filter(pk=pk, accountant=profile, status="pending").update(status="cancelled")
        return Response(status=204)


class ClientInvitationsView(APIView):
    """
    Client side of the invitation system.

    GET  /api/users/client/invitations/             — list pending invitations for this user
    POST /api/users/client/invitations/<pk>/respond/ — accept or decline
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import AccountantInvitation
        invs = AccountantInvitation.objects.filter(
            client_user=request.user,
            status="pending",
        ).select_related("accountant__user").order_by("-created_at")

        # Also pick up invitations sent to this email before they registered
        email_invs = AccountantInvitation.objects.filter(
            invited_email__iexact=request.user.email,
            client_user__isnull=True,
            status="pending",
        ).select_related("accountant__user")

        # Link unlinked invitations
        for inv in email_invs:
            inv.client_user = request.user
            inv.save(update_fields=["client_user"])

        all_invs = list(invs) + list(email_invs)

        result = [
            {
                "id":               inv.id,
                "inv_type":         "accountant",
                "firm_name":        inv.accountant.firm_name or inv.accountant.user.get_full_name() or inv.accountant.user.email,
                "accountant_email": inv.accountant.user.email,
                "message":          inv.message,
                "status":           inv.status,
                "created_at":       inv.created_at.date().isoformat(),
            }
            for inv in all_invs
        ]

        # Also include pending portal invitations sent to this email.
        # Deduplicate: skip if the same accountant email already appeared via AccountantInvitation.
        seen_accountant_emails = {r["accountant_email"] for r in result}
        try:
            from apps.portal.models import Invitation as PortalInvitation
            portal_invs = PortalInvitation.objects.filter(
                client_email__iexact=request.user.email,
                status="pending",
            ).select_related("sent_by").order_by("-created_at")
            for inv in portal_invs:
                if inv.sent_by.email in seen_accountant_emails:
                    continue
                acct = getattr(inv.sent_by, "accountant_profile", None)
                firm = (acct.firm_name if acct else None) or inv.sent_by.get_full_name() or inv.sent_by.email
                result.append({
                    "id":               inv.id,
                    "inv_type":         "portal",
                    "firm_name":        firm,
                    "accountant_email": inv.sent_by.email,
                    "message":          inv.message,
                    "status":           inv.status,
                    "created_at":       inv.created_at.date().isoformat(),
                    "token":            inv.token,
                })
                seen_accountant_emails.add(inv.sent_by.email)
        except Exception:
            logger.exception("Failed to fetch portal invitations for user %s", request.user.id)

        result.sort(key=lambda x: x["created_at"], reverse=True)
        return Response(result)

    def post(self, request, pk=None):
        from .models import AccountantInvitation, AccountantClient
        action = (request.data.get("action") or "").strip()
        if action not in ("accept", "decline"):
            return Response({"error": "action must be 'accept' or 'decline'."}, status=400)

        inv_type = (request.data.get("inv_type") or "accountant").strip()

        # Route portal invitations to the portal accept logic
        if inv_type == "portal":
            try:
                from apps.portal.models import Invitation as PortalInvitation
                from apps.portal.services.accountant_checklists import create_checklist_for_engagement
                from apps.portal.models import AccountantClientProfile, TaxEngagement
                inv = PortalInvitation.objects.select_related("sent_by").get(
                    pk=pk, status="pending",
                )
            except Exception:
                return Response({"error": "Invitation not found."}, status=404)

            if inv.client_email.lower() != request.user.email.lower():
                return Response({"error": "Not your invitation."}, status=403)

            if action == "decline":
                from apps.portal.services.invitation_service import decline_portal_invitation
                decline_portal_invitation(inv)
                return Response({"status": "declined"})

            # Accept
            from django.utils import timezone
            if inv.expires_at <= timezone.now():
                inv.status = "expired"; inv.save(update_fields=["status"])
                return Response({"error": "This invitation has expired."}, status=400)

            inv.client_user = request.user; inv.status = "accepted"; inv.accepted_at = timezone.now()
            inv.save(update_fields=["client_user", "status", "accepted_at"])

            # Find the profile pre-created when the invitation was sent
            # (keyed on accountant_user + email with client_user=None).
            # Link it to the accepting user instead of creating a new duplicate.
            profile = AccountantClientProfile.objects.filter(
                accountant_user=inv.sent_by,
                email__iexact=inv.client_email,
            ).first()

            if profile:
                # Update the pre-created profile — link client_user and activate
                profile.client_user = request.user
                profile.status      = "active"
                if not profile.first_name:
                    profile.first_name = getattr(request.user, "first_name", "")
                if not profile.last_name:
                    profile.last_name  = getattr(request.user, "last_name", "")
                profile.save(update_fields=[
                    "client_user", "status", "first_name", "last_name", "updated_at"
                ])
            else:
                # No pre-created profile — create one fresh
                profile = AccountantClientProfile.objects.create(
                    accountant_user = inv.sent_by,
                    client_user     = request.user,
                    email           = request.user.email,
                    first_name      = getattr(request.user, "first_name", ""),
                    last_name       = getattr(request.user, "last_name", ""),
                    status          = "active",
                    tax_year        = inv.tax_year,
                )

            try:
                acc_profile = AccountantProfile.objects.get(user=inv.sent_by)
                AccountantClient.objects.get_or_create(
                    accountant=acc_profile, client_user=request.user,
                    defaults={"status": "active"},
                )
            except Exception:
                logger.exception("Failed to create AccountantClient link on portal inv accept (inv=%s)", inv.id)

            engagement = TaxEngagement.objects.filter(client_profile=profile).order_by("-created_at").first()
            if not engagement:
                engagement = TaxEngagement.objects.create(
                    accountant=inv.sent_by, client_profile=profile,
                    tax_year=inv.tax_year, status="collecting",
                )
                try:
                    create_checklist_for_engagement(engagement)
                except Exception:
                    logger.exception("Failed to create checklist for engagement %s on portal inv accept", engagement.id)
            inv.engagement = engagement; inv.save(update_fields=["engagement"])

            # ── Notify accountant that invitation was accepted ─────────────────────
            try:
                from apps.users.notification_utils import create_notification
                client_display = (
                    request.user.get_full_name().strip()
                    or request.user.email
                )
                create_notification(
                    user       = inv.sent_by,
                    notif_type = "invitation_accepted",
                    title      = f"{client_display} accepted your invitation",
                    body       = (
                        f"{client_display} has joined TaxWijs and accepted your "
                        f"portal invitation. Their tax file is now active."
                    ),
                    action_url = f"/accountant/clients/{profile.id}",
                    metadata   = {
                        "invitation_id": inv.id,
                        "profile_id":    profile.id,
                    },
                )
            except Exception:
                logger.warning("Failed to send invitation_accepted notification (inv=%s)", inv.id)
            # ──────────────────────────────────────────────────────────────────────

            return Response({"status": "accepted"})

        try:
            inv = AccountantInvitation.objects.select_related("accountant__user").get(
                pk=pk,
                status="pending",
            )
        except AccountantInvitation.DoesNotExist:
            return Response({"error": "Invitation not found."}, status=404)

        # Authorise: only the invited user (by email or FK) can respond
        is_owner = (
            inv.client_user_id == request.user.id
            or inv.invited_email.lower() == request.user.email.lower()
        )
        if not is_owner:
            return Response({"error": "Not your invitation."}, status=403)

        if action == "accept":
            inv.status = "accepted"
            inv.client_user = request.user
            inv.save(update_fields=["status", "client_user", "updated_at"])

            # Create the AccountantClient link (idempotent)
            AccountantClient.objects.get_or_create(
                accountant=inv.accountant,
                client_user=request.user,
                defaults={"nickname": request.user.get_full_name() or request.user.email},
            )

            # Create the portal AccountantClientProfile (idempotent via accountant+client pair)
            try:
                from apps.portal.models import AccountantClientProfile, TaxEngagement
                from apps.portal.services.accountant_checklists import create_checklist_for_engagement
                from django.utils import timezone as tz
                intake = request.user.intake_profile or {}
                raw_type = intake.get("user_type", "other")
                raw_lang = intake.get("language", "nl")
                client_type = "zzp"
                preferred_language = raw_lang if raw_lang in ("nl", "en", "fa") else "nl"
                profile, _created = AccountantClientProfile.objects.get_or_create(
                    accountant_user=inv.accountant.user,
                    client_user=request.user,
                    defaults={
                        "email":              request.user.email,
                        "first_name":         request.user.first_name or "",
                        "last_name":          request.user.last_name or "",
                        "client_type":        client_type,
                        "preferred_language": preferred_language,
                        "status":             "active",
                    },
                )
                # Create engagement + checklist if none exists yet
                engagement, eng_created = TaxEngagement.objects.get_or_create(
                    accountant=inv.accountant,
                    client_profile=profile,
                    tax_year=tz.now().year,
                    defaults={"status": "collecting", "engagement_type": "income_tax"},
                )
                if eng_created:
                    try:
                        create_checklist_for_engagement(engagement)
                    except Exception:
                        logger.warning("Failed to generate checklist for legacy inv accept (inv=%s)", inv.id)
            except Exception:
                logger.exception("Failed to create portal profile/engagement for legacy inv (inv=%s)", inv.id)

            # Push notification to accountant
            firm = inv.accountant.firm_name or inv.accountant.user.email
            from .push_utils import send_push_notification
            send_push_notification(
                inv.accountant.user,
                title="Invitation accepted",
                body=f"{request.user.email} has accepted your invitation on TaxWijs.",
                url="/accountant/portal",
            )

        else:
            inv.status = "declined"
            inv.client_user = request.user
            inv.save(update_fields=["status", "client_user", "updated_at"])

            # Notify accountant of the decline too
            from .push_utils import send_push_notification
            send_push_notification(
                inv.accountant.user,
                title="Invitation declined",
                body=f"{request.user.email} declined your invitation.",
                url="/accountant/portal",
            )

        return Response({"status": inv.status})


# ── Web Push subscription management ─────────────────────────────────────────

class PushVapidKeyView(APIView):
    """GET /api/users/push/vapid-key/ — returns the VAPID public key for the frontend."""
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .push_utils import VAPID_PUBLIC_KEY
        return Response({"public_key": VAPID_PUBLIC_KEY})


class PushSubscribeView(APIView):
    """
    POST /api/users/push/subscribe/     — register a push subscription
    DELETE /api/users/push/subscribe/   — remove all subscriptions for this user
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .models import PushSubscription
        endpoint = request.data.get("endpoint", "").strip()
        p256dh   = request.data.get("p256dh", "").strip()
        auth     = request.data.get("auth", "").strip()
        ua       = request.META.get("HTTP_USER_AGENT", "")[:300]

        if not (endpoint and p256dh and auth):
            return Response({"error": "endpoint, p256dh, and auth are required."}, status=400)

        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={"user": request.user, "p256dh": p256dh, "auth": auth, "user_agent": ua},
        )
        return Response({"status": "subscribed"}, status=201)

    def delete(self, request):
        from .models import PushSubscription
        endpoint = request.data.get("endpoint", "").strip()
        if endpoint:
            PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        else:
            PushSubscription.objects.filter(user=request.user).delete()
        return Response(status=204)


class ClientMyAccountantView(APIView):
    """
    GET    /api/users/client/my-accountant/        — list accountants connected to this user
    DELETE /api/users/client/my-accountant/<pk>/   — disconnect from an accountant
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import AccountantClient
        links = AccountantClient.objects.filter(
            client_user=request.user,
        ).select_related("accountant__user")
        return Response([
            {
                "id":               link.id,
                "firm_name":        link.accountant.firm_name or link.accountant.user.get_full_name() or link.accountant.user.email,
                "accountant_email": link.accountant.user.email,
                "connected_since":  link.created_at.date().isoformat(),
            }
            for link in links
        ])

    def delete(self, request, pk=None):
        from .models import AccountantClient
        from django.utils import timezone
        link_qs = AccountantClient.objects.filter(pk=pk, client_user=request.user)
        accountant_user_id = link_qs.values_list("accountant__user_id", flat=True).first()
        link_qs.delete()
        if accountant_user_id:
            try:
                from apps.portal.models import AccountantClientProfile
                AccountantClientProfile.objects.filter(
                    client_user=request.user,
                    accountant_user_id=accountant_user_id,
                ).exclude(status__in=["deactivated", "archived"]).update(
                    status="deactivated",
                    deactivated_at=timezone.now(),
                )
            except Exception:
                pass
        return Response(status=204)


class AccountDeletionView(APIView):
    """
    DELETE /api/users/me/
    GDPR account deletion — anonymizes PII and marks account inactive.
    The user must send {"confirm": true} in the request body.
    Data is anonymized (not hard-deleted) to preserve audit trail integrity.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        confirm = request.data.get("confirm", False)
        if not confirm:
            return Response(
                {"detail": "Send {\"confirm\": true} to confirm account deletion."},
                status=400,
            )
        from django.utils import timezone
        user = request.user
        user.deletion_requested_at = timezone.now()
        user.save(update_fields=["deletion_requested_at"])
        user.anonymize()
        return Response({"detail": "Account anonymized. All personal data has been erased."}, status=200)


class DataExportView(APIView):
    """
    GET /api/users/me/data-export/
    GDPR data portability — returns a JSON summary of all data held for the user.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        from apps.portal.models import AccountantClientProfile, ClientDocument
        from apps.zzp.models import ZZPRevenueEntry, ZZPExpenseEntry, ZZPHoursEntry, ZZPMileageEntry
        from apps.chat.models import Conversation

        return Response({
            "user": {
                "email":    user.email,
                "username": user.username,
                "joined":   user.date_joined.date().isoformat(),
                "role":     user.role,
            },
            "intake_profile": user.intake_profile,
            "tax_memory":     user.tax_memory,
            "zzp_revenue_count":   ZZPRevenueEntry.objects.filter(user=user).count(),
            "zzp_expense_count":   ZZPExpenseEntry.objects.filter(user=user).count(),
            "zzp_hours_count":     ZZPHoursEntry.objects.filter(user=user).count(),
            "zzp_mileage_count":   ZZPMileageEntry.objects.filter(user=user).count(),
            "portal_document_count": ClientDocument.objects.filter(uploaded_by=user).count(),
            "conversation_count":  Conversation.objects.filter(user=user).count(),
        })


# ── In-app Notifications ──────────────────────────────────────────────────────

class InAppNotificationsView(APIView):
    """
    GET  /api/users/inapp-notifications/?page=1&page_size=50  — paginated list (newest first)
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import Notification
        try:
            page      = max(1, int(request.query_params.get("page", 1)))
            page_size = min(100, max(1, int(request.query_params.get("page_size", 50))))
        except (ValueError, TypeError):
            page, page_size = 1, 50

        qs    = Notification.objects.filter(user=request.user).order_by("-created_at")
        total = qs.count()
        offset = (page - 1) * page_size
        notifs = qs[offset: offset + page_size]

        data = [
            {
                "id":                n.id,
                "notification_type": n.notification_type,
                "title":             n.title,
                "body":              n.body,
                "is_read":           n.is_read,
                "action_url":        n.action_url,
                "created_at":        n.created_at.isoformat(),
            }
            for n in notifs
        ]
        return Response({"count": total, "page": page, "page_size": page_size, "results": data})


class InAppNotificationReadAllView(APIView):
    """POST /api/users/inapp-notifications/read-all/"""
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .models import Notification
        from django.utils import timezone
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({"ok": True})


class InAppNotificationDetailView(APIView):
    """
    PATCH /api/users/inapp-notifications/<id>/read/   — mark one as read
    DELETE /api/users/inapp-notifications/<id>/        — permanently clear one
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        from .models import Notification
        from django.utils import timezone
        from django.shortcuts import get_object_or_404
        notif = get_object_or_404(Notification, pk=pk, user=request.user)
        if not notif.is_read:
            notif.is_read = True
            notif.read_at = timezone.now()
            notif.save(update_fields=["is_read", "read_at"])
        return Response({"ok": True})

    def delete(self, request, pk):
        from .models import Notification
        from django.shortcuts import get_object_or_404
        notif = get_object_or_404(Notification, pk=pk, user=request.user)
        notif.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InAppUnreadCountView(APIView):
    """GET /api/users/inapp-notifications/unread-count/ — lightweight badge poll"""
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import Notification
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"count": count})


class AccountantMarketplaceView(APIView):
    """
    GET /api/users/marketplace/ — list verified, active accountant listings.

    Supports optional filters via query params:
      ?lang=nl|en|fa            — language preference (affects bio returned)
      ?specialization=zzp|it_tech|creative_media|consulting|trades_construction|healthcare_wellness|international|other  — filter by specialization
      ?languages=nl,fa          — comma-separated: accountant must speak these
    Returns up to 20 results ordered by rating desc.
    """
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from .models import AccountantListing
        lang = request.query_params.get("lang", "en")
        spec = request.query_params.get("specialization", "")
        langs_filter = request.query_params.get("languages", "")

        qs = AccountantListing.objects.filter(is_active=True, verified_accountant=True)

        if spec:
            qs = [l for l in qs if spec in (l.specializations or [])]
        else:
            qs = list(qs)

        if langs_filter:
            needed = [x.strip() for x in langs_filter.split(",") if x.strip()]
            qs = [l for l in qs if all(n in (l.languages or []) for n in needed)]

        bio_field = f"bio_{lang}" if lang in ("nl", "en", "fa") else "bio_en"

        data = []
        for l in qs[:20]:
            data.append({
                "id": l.id,
                "display_name": l.display_name,
                "bio": getattr(l, bio_field, "") or l.bio_en or "",
                "specializations": l.specializations or [],
                "languages": l.languages or [],
                "hourly_rate_display": l.hourly_rate_display,
                "accepts_new_clients": l.accepts_new_clients,
                "calendly_url": l.calendly_url,
                "rating": l.rating,
                "review_count": l.review_count,
            })

        return Response(data)


# ── Google Calendar OAuth 2-way sync ─────────────────────────────────────────

class GoogleCalendarAuthUrlView(APIView):
    """GET /api/users/google-calendar/auth-url/ — returns the OAuth consent URL."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.conf import settings
        from apps.users.services.google_calendar import get_auth_url
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            return Response(
                {"error": "Google Calendar sync not configured on this server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        from django.core import signing
        redirect_uri = settings.GOOGLE_CALENDAR_REDIRECT_URI
        # Sign the state so it cannot be forged (prevents OAuth CSRF)
        signed_state = signing.dumps(request.user.pk, salt="gcal_oauth")
        url = get_auth_url(redirect_uri=redirect_uri, state=signed_state)
        return Response({"auth_url": url})


class GoogleCalendarCallbackView(APIView):
    """GET /api/users/google-calendar/callback/ — OAuth redirect target from Google."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.conf import settings
        from django.shortcuts import redirect as django_redirect
        from apps.users.services.google_calendar import exchange_code, _encrypt

        code  = request.query_params.get("code")
        state = request.query_params.get("state")   # encoded user_id
        error = request.query_params.get("error")

        frontend_base = getattr(settings, "FRONTEND_URL", "")

        if error or not code or not state:
            return django_redirect(f"{frontend_base}/tax-calendar?gcal=denied")

        try:
            from django.core import signing
            user_id = signing.loads(state, salt="gcal_oauth", max_age=3600)
            user = User.objects.get(pk=user_id)
        except (signing.BadSignature, signing.SignatureExpired, ValueError, User.DoesNotExist):
            return django_redirect(f"{frontend_base}/tax-calendar?gcal=error")

        try:
            tokens = exchange_code(code, settings.GOOGLE_CALENDAR_REDIRECT_URI)
            refresh_token = tokens.get("refresh_token")
            if not refresh_token:
                return django_redirect(f"{frontend_base}/tax-calendar?gcal=no_refresh_token")

            user.google_calendar_refresh_token = _encrypt(refresh_token)
            user.google_calendar_enabled = True
            user.save(update_fields=["google_calendar_refresh_token", "google_calendar_enabled"])

            from apps.users.tasks import push_google_calendar_task
            push_google_calendar_task.delay(user.pk)

        except Exception:
            return django_redirect(f"{frontend_base}/tax-calendar?gcal=error")

        return django_redirect(f"{frontend_base}/tax-calendar?gcal=connected")


class GoogleCalendarDisconnectView(APIView):
    """DELETE /api/users/google-calendar/disconnect/ — revoke token and disable sync."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        from apps.users.services.google_calendar import revoke_token, _decrypt
        user = request.user
        if user.google_calendar_refresh_token:
            try:
                raw = _decrypt(user.google_calendar_refresh_token)
                revoke_token(raw)
            except Exception:
                pass
        user.google_calendar_refresh_token = None
        user.google_calendar_enabled = False
        user.save(update_fields=["google_calendar_refresh_token", "google_calendar_enabled"])
        return Response({"status": "disconnected"})


class GoogleCalendarSyncNowView(APIView):
    """POST /api/users/google-calendar/sync/ — trigger an immediate push."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.google_calendar_enabled:
            return Response({"error": "Google Calendar sync not connected."}, status=400)
        from apps.users.tasks import push_google_calendar_task
        push_google_calendar_task.delay(user.pk)
        return Response({"status": "queued"})


class GoogleCalendarStatusView(APIView):
    """GET /api/users/google-calendar/status/ — returns sync status for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            "enabled": request.user.google_calendar_enabled,
            "connected": bool(request.user.google_calendar_refresh_token),
        })


class AccountantAccessRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from apps.users.models import AccountantAccessRequest
        email      = (request.data.get("email", "") or "").strip().lower()
        full_name  = (request.data.get("full_name", "") or "").strip()
        firm_name  = (request.data.get("firm_name", "") or "").strip()
        kvk_number = (request.data.get("kvk_number", "") or "").strip()
        designation = (request.data.get("designation", "other") or "other").strip()
        motivation = (request.data.get("motivation", "") or "").strip()
        if not email or not full_name:
            return Response({"detail": "email and full_name are required."}, status=status.HTTP_400_BAD_REQUEST)
        if AccountantAccessRequest.objects.filter(email__iexact=email).exists():
            return Response({"detail": "A request for this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
        AccountantAccessRequest.objects.create(
            email=email, full_name=full_name, firm_name=firm_name,
            kvk_number=kvk_number, designation=designation, motivation=motivation,
        )
        return Response({"detail": "Request submitted. You will be notified once reviewed."}, status=status.HTTP_201_CREATED)


class AccountantAccessApproveView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        from apps.users.models import AccountantAccessRequest, AccountantProfile
        from django.utils import timezone as tz
        req = get_object_or_404(AccountantAccessRequest, pk=pk)
        if req.status != "pending":
            return Response({"detail": f"Request is already {req.status}."}, status=status.HTTP_400_BAD_REQUEST)
        # Explicit filter-then-create to avoid __iexact get_or_create pitfalls
        user = User.objects.filter(email__iexact=req.email).first()
        created = False
        if not user:
            name_parts = req.full_name.strip().split(" ", 1) if req.full_name.strip() else ["", ""]
            base_username = req.email
            username = base_username
            suffix = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{suffix}"
                suffix += 1
            user = User.objects.create_user(
                email      = req.email,
                username   = username,
                first_name = name_parts[0],
                last_name  = name_parts[1] if len(name_parts) > 1 else "",
                password   = None,
            )
            created = True

        user.role = "accountant"

        # Allow admin to set an initial plan at approval time
        plan_choices = {"free", "professional", "firm"}
        initial_plan = (request.data.get("plan", "") or "").strip().lower()
        if initial_plan and initial_plan in plan_choices:
            user.plan = initial_plan
            user.save(update_fields=["role", "plan"])
        else:
            user.save(update_fields=["role"])

        # ── Send activation email to newly-approved accountant ─────────────
        try:
            from django.contrib.auth.tokens import default_token_generator
            from django.utils.http import urlsafe_base64_encode
            from django.utils.encoding import force_bytes
            from django.conf import settings as _s
            from django.core.mail import send_mail

            uid   = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            frontend_url = getattr(_s, "FRONTEND_URL", "https://taxwijs.nl")
            set_pw_link  = f"{frontend_url}/reset-password?uid={uid}&token={token}"
            plan_display = (initial_plan or "free").capitalize()

            send_mail(
                subject="Your TaxWijs accountant account is approved — Set your password",
                message=(
                    f"Dear {req.full_name or req.email},\n\n"
                    f"Your TaxWijs accountant account has been approved.\n"
                    f"Plan: {plan_display}\n\n"
                    f"Set your password and log in here:\n{set_pw_link}\n\n"
                    f"This link expires in 24 hours.\n\n"
                    f"Kind regards,\nThe TaxWijs Team"
                ),
                from_email=getattr(_s, "DEFAULT_FROM_EMAIL", "noreply@taxwijs.nl"),
                recipient_list=[user.email],
                fail_silently=True,
            )
        except Exception as _e:
            logger.warning("Accountant approval email failed for %s: %s", user.email, _e)
        # ── End activation email ───────────────────────────────────────────

        AccountantProfile.objects.get_or_create(
            user=user,
            defaults={"firm_name": req.firm_name, "kvk_number": req.kvk_number,
                      "designation": req.designation, "is_verified": True},
        )
        req.status = "approved"; req.reviewed_by = request.user; req.reviewed_at = tz.now()
        req.save(update_fields=["status", "reviewed_by", "reviewed_at"])
        return Response({"detail": f"Approved. User {req.email} is now an accountant."})


class PasswordResetRequestView(APIView):
    """
    POST /api/users/password-reset/request/
    Public — takes email, generates a secure token, sends reset email.
    Always returns 200 (security: don't reveal if email exists).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        from django.conf import settings as _s
        from django.core.mail import send_mail

        email = (request.data.get("email", "") or "").strip().lower()
        if not email:
            return Response({"detail": "email is required."}, status=400)

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            uid   = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            frontend_url = getattr(_s, "FRONTEND_URL", "https://taxwijs.nl")
            reset_link   = f"{frontend_url}/reset-password?uid={uid}&token={token}"
            lang = getattr(user, "preferred_language", "en") or "en"

            SUBJECTS = {
                "nl": "Wachtwoord opnieuw instellen — TaxWijs",
                "en": "Reset your password — TaxWijs",
                "fa": "بازنشانی رمز عبور — TaxWijs",
            }
            BODIES = {
                "nl": (
                    f"Hallo,\n\nU heeft een wachtwoordherstel aangevraagd voor uw TaxWijs-account.\n\n"
                    f"Klik op de onderstaande link om uw wachtwoord opnieuw in te stellen:\n{reset_link}\n\n"
                    f"Deze link is 24 uur geldig.\n\nAls u dit niet heeft aangevraagd, kunt u dit bericht negeren.\n\n"
                    f"Met vriendelijke groet,\nHet TaxWijs-team"
                ),
                "en": (
                    f"Hello,\n\nYou requested a password reset for your TaxWijs account.\n\n"
                    f"Click the link below to set a new password:\n{reset_link}\n\n"
                    f"This link expires in 24 hours.\n\nIf you didn't request this, you can safely ignore this email.\n\n"
                    f"Kind regards,\nThe TaxWijs Team"
                ),
                "fa": (
                    f"سلام،\n\nشما درخواست بازنشانی رمز عبور برای حساب TaxWijs خود را ارسال کرده‌اید.\n\n"
                    f"برای تنظیم رمز عبور جدید روی لینک زیر کلیک کنید:\n{reset_link}\n\n"
                    f"این لینک ۲۴ ساعت معتبر است.\n\nاگر این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.\n\n"
                    f"با احترام،\nتیم TaxWijs"
                ),
            }
            try:
                send_mail(
                    subject=SUBJECTS.get(lang, SUBJECTS["en"]),
                    message=BODIES.get(lang, BODIES["en"]),
                    from_email=getattr(_s, "DEFAULT_FROM_EMAIL", "noreply@taxwijs.nl"),
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception as e:
                logger.warning("Password reset email failed for %s: %s", email, e)

        return Response({
            "detail": "If an account with this email exists, a reset link has been sent."
        })


class PasswordResetConfirmView(APIView):
    """
    POST /api/users/password-reset/confirm/
    Public — validates uid + token, sets new password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_decode
        from django.utils.encoding import force_str

        uid      = (request.data.get("uid",      "") or "").strip()
        token    = (request.data.get("token",    "") or "").strip()
        password = (request.data.get("password", "") or "").strip()

        if not all([uid, token, password]):
            return Response({"detail": "uid, token, and password are required."}, status=400)
        if len(password) < 8:
            return Response({"detail": "Password must be at least 8 characters."}, status=400)

        try:
            pk   = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Invalid or expired reset link."}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired reset link."}, status=400)

        user.set_password(password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password has been set successfully. You can now log in."})
