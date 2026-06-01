import requests as http_requests
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from config.authentication import SoftJWTAuthentication
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from .alerts import generate_alerts
from .actions import generate_actions


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


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
        alerts += self._rule_change_alerts(profile.get("user_type", ""), lang)
        return Response(alerts)

    def _rule_change_alerts(self, user_type: str, lang: str) -> list:
        """Query DB for recently updated verified rules relevant to this user_type."""
        try:
            from django.utils import timezone
            from datetime import timedelta
            from apps.tax.models import TaxRule
            since = timezone.now() - timedelta(days=30)
            qs = TaxRule.objects.filter(verification_status="verified", updated_at__gte=since, year=2026)
            result = []
            for rule in qs[:5]:
                if rule.user_types and user_type and user_type not in rule.user_types:
                    continue
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
        alerts += self._rule_change_alerts(profile.get("user_type", ""), lang)
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


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        access_token = request.data.get("access_token")
        user_type = request.data.get("user_type", "zzp")

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

        # Get or create user
        try:
            user = User.objects.get(email__iexact=email)
            created = False
        except User.DoesNotExist:
            user = User.objects.create_user(
                email=email,
                username=email,
                password=None,
                user_type=user_type,
            )
            created = True

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_new": created,
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
