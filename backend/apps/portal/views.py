"""
Portal API views.

Permission model:
  - Accountant can only access their own clients and engagements.
  - Client can only access their own assigned profile / engagement.
  - Staff can access everything.
  - Unauthenticated requests are always rejected.

All file uploads are validated by ClientDocumentUploadSerializer.
All write operations are logged via _audit().
"""
from __future__ import annotations

import logging

from django.db.models import F
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    AccountantClientProfile, TaxEngagement, DocumentRequest,
    ClientDocument, ExtractedIncome, ExtractedExpense,
    ChecklistItem, AccountantAction, PortalAuditLog,
    ReminderLog, PortalMessage,
)
from apps.users.push_utils import send_push_notification
from apps.users.notification_utils import create_notification
from apps.portal.services.tax_constants import (
    DGA_GEBRUIKELIJK_LOON_MIN,
    BOX2_RATE_LOW_THRESHOLD,
    BOX2_RATE_LOW,
    BOX2_RATE_HIGH,
    BOX3_VRIJSTELLING,
    RULING_30_PCT_CAP,
)
from .serializers import (
    AccountantClientProfileSerializer, TaxEngagementSerializer,
    DocumentRequestSerializer, ClientDocumentSerializer,
    ClientDocumentUploadSerializer, ExtractedIncomeSerializer,
    ExtractedExpenseSerializer, ChecklistItemSerializer,
    AccountantActionSerializer, PortalAuditLogSerializer,
    ReminderLogSerializer, PortalMessageSerializer,
)

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _audit(request, action, entity_type="", entity_id="",
           client_profile=None, engagement=None,
           before=None, after=None):
    PortalAuditLog.objects.create(
        actor_user=request.user if request.user.is_authenticated else None,
        accountant=request.user if request.user.is_authenticated else None,
        client_profile=client_profile,
        engagement=engagement,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        before_json=before,
        after_json=after,
    )


def _is_accountant_of_client(user, client_profile):
    """True if the user owns the AccountantClientProfile."""
    return client_profile.accountant_user_id == user.id


def _is_client_of_profile(user, client_profile):
    """True if the user is the linked client user."""
    return client_profile.client_user_id == user.id


def _is_portal_user(user):
    """True if this user has accountant or admin access to the portal."""
    return user.is_staff or getattr(user, "role", "client") in ("accountant", "admin")


def _can_access_client(user, client_profile):
    if user.is_staff:
        return True
    return (
        _is_accountant_of_client(user, client_profile)
        or _is_client_of_profile(user, client_profile)
    )


def _can_access_engagement(user, engagement):
    return _can_access_client(user, engagement.client_profile)


# ── Client Profile CRUD ───────────────────────────────────────────────────────

class AccountantClientListView(APIView):
    """
    GET  /api/portal/clients/         — list accountant's clients
    POST /api/portal/clients/         — create new client profile
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
            qs = AccountantClientProfile.objects.all()
        elif not _is_portal_user(request.user):
            return Response({"error": "Portal access requires an accountant account."}, status=403)
        else:
            # Exclude self-managed profiles (accountant_user == client_user)
            qs = AccountantClientProfile.objects.filter(
                accountant_user=request.user
            ).exclude(client_user=F("accountant_user"))
        serializer = AccountantClientProfileSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        if not _is_portal_user(request.user):
            return Response({"error": "Portal access requires an accountant account."}, status=403)

        from apps.portal.services.plan_limits import check_client_limit
        allowed, err_msg = check_client_limit(request.user)
        if not allowed:
            return Response({"detail": err_msg, "upgrade_required": True}, status=status.HTTP_402_PAYMENT_REQUIRED)

        data = request.data.copy()
        serializer = AccountantClientProfileSerializer(data=data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        profile = serializer.save(accountant_user=request.user)
        _audit(request, "client_created", "AccountantClientProfile", profile.id, client_profile=profile)
        return Response(AccountantClientProfileSerializer(profile, context={"request": request}).data, status=status.HTTP_201_CREATED)


class AccountantClientDetailView(APIView):
    """
    GET   /api/portal/clients/<id>/  — get client profile
    PATCH /api/portal/clients/<id>/  — partial update
    DELETE /api/portal/clients/<id>/ — archive (soft delete)
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_profile(self, request, pk):
        profile = get_object_or_404(AccountantClientProfile, pk=pk)
        if not _can_access_client(request.user, profile):
            return None, Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return profile, None

    def get(self, request, pk):
        profile, err = self._get_profile(request, pk)
        if err:
            return err
        return Response(AccountantClientProfileSerializer(profile, context={"request": request}).data)

    def patch(self, request, pk):
        profile, err = self._get_profile(request, pk)
        if err:
            return err
        before = AccountantClientProfileSerializer(profile).data
        serializer = AccountantClientProfileSerializer(
            profile, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        profile = serializer.save()
        _audit(request, "client_updated", "AccountantClientProfile", profile.id,
               client_profile=profile, before=before,
               after=AccountantClientProfileSerializer(profile).data)
        return Response(AccountantClientProfileSerializer(profile, context={"request": request}).data)

    def delete(self, request, pk):
        profile, err = self._get_profile(request, pk)
        if err:
            return err
        if not _is_accountant_of_client(request.user, profile) and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        # Also remove the AccountantClient link in the users app
        if profile.client_user_id:
            try:
                from apps.users.models import AccountantProfile, AccountantClient
                acc_profile = AccountantProfile.objects.get(user=request.user)
                AccountantClient.objects.filter(
                    accountant=acc_profile,
                    client_user_id=profile.client_user_id,
                ).delete()
            except Exception:
                pass

        _audit(request, "client_deleted", "AccountantClientProfile", profile.id, client_profile=profile)
        profile.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


DISCONNECT_GRACE_DAYS = 30


def _deactivate_client_link(profile):
    """Deactivate the AccountantClient link so the client loses has_accountant."""
    if profile.client_user_id:
        try:
            from apps.users.models import AccountantProfile, AccountantClient
            acc_profile = AccountantProfile.objects.get(user=profile.accountant_user)
            AccountantClient.objects.filter(
                accountant=acc_profile,
                client_user_id=profile.client_user_id,
                status="active",
            ).update(status="deactivated", deactivated_at=timezone.now())
        except Exception:
            pass


def _reactivate_client_link(profile):
    """Restore the AccountantClient link so the client regains has_accountant."""
    if profile.client_user_id:
        try:
            from apps.users.models import AccountantProfile, AccountantClient
            acc_profile = AccountantProfile.objects.get(user=profile.accountant_user)
            AccountantClient.objects.filter(
                accountant=acc_profile,
                client_user_id=profile.client_user_id,
                status="deactivated",
            ).update(status="active", deactivated_at=None)
        except Exception:
            pass


class AccountantClientDisconnectView(APIView):
    """
    POST /api/portal/clients/<pk>/disconnect/

    Accountant deactivates a client. The profile is kept for 30 days
    with status='deactivated' so it can be reactivated if needed.
    After 30 days the purge_expired_client_data management command removes it.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        profile = get_object_or_404(AccountantClientProfile, pk=pk)
        if not _is_accountant_of_client(request.user, profile) and not request.user.is_staff:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if profile.status == "deactivated":
            return Response({"detail": "Client is already deactivated."}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        profile.status               = "deactivated"
        profile.deactivated_at       = now
        profile.scheduled_deletion_at = now + timezone.timedelta(days=DISCONNECT_GRACE_DAYS)
        profile.save(update_fields=["status", "deactivated_at", "scheduled_deletion_at", "updated_at"])

        _deactivate_client_link(profile)
        _audit(request, "client_deactivated", "AccountantClientProfile", profile.id, client_profile=profile)

        return Response(
            AccountantClientProfileSerializer(profile, context={"request": request}).data
        )


class AccountantClientReactivateView(APIView):
    """
    POST /api/portal/clients/<pk>/reactivate/

    Accountant reactivates a deactivated client within the 30-day window.
    Restores status to 'active' and clears the scheduled deletion date.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        profile = get_object_or_404(AccountantClientProfile, pk=pk)
        if not _is_accountant_of_client(request.user, profile) and not request.user.is_staff:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if profile.status != "deactivated":
            return Response({"detail": "Client is not deactivated."}, status=status.HTTP_400_BAD_REQUEST)
        if profile.scheduled_deletion_at and profile.scheduled_deletion_at <= timezone.now():
            return Response(
                {"detail": "Grace period has expired. Client data has been scheduled for deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.status                = "active"
        profile.deactivated_at        = None
        profile.scheduled_deletion_at = None
        profile.save(update_fields=["status", "deactivated_at", "scheduled_deletion_at", "updated_at"])

        _reactivate_client_link(profile)
        _audit(request, "client_reactivated", "AccountantClientProfile", profile.id, client_profile=profile)

        return Response(
            AccountantClientProfileSerializer(profile, context={"request": request}).data
        )


class ClientSelfDisconnectView(APIView):
    """
    POST /api/portal/client/disconnect/

    Allows the client to sever the connection from their side.
    Same 30-day grace-period logic applies — the accountant can still
    reactivate within that window.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = _get_or_create_self_service_profile(request.user)
        if profile.status == "deactivated":
            return Response({"detail": "Already disconnected."}, status=status.HTTP_400_BAD_REQUEST)
        # Self-service profiles (accountant_user == client_user) have no external accountant
        if profile.accountant_user_id == profile.client_user_id:
            return Response(
                {"detail": "No accountant connection to disconnect."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        profile.status                = "deactivated"
        profile.deactivated_at        = now
        profile.scheduled_deletion_at = now + timezone.timedelta(days=DISCONNECT_GRACE_DAYS)
        profile.save(update_fields=["status", "deactivated_at", "scheduled_deletion_at", "updated_at"])

        _deactivate_client_link(profile)
        _audit(request, "client_self_disconnected", "AccountantClientProfile", profile.id, client_profile=profile)

        return Response({"detail": "Disconnected. Your data will be retained for 30 days."})


# ── Engagement CRUD ───────────────────────────────────────────────────────────

class EngagementListView(APIView):
    """
    GET  /api/portal/engagements/
    POST /api/portal/engagements/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
            qs = TaxEngagement.objects.select_related("client_profile").all()
        else:
            # Exclude self-managed engagements where accountant == client
            qs = TaxEngagement.objects.select_related("client_profile").filter(
                accountant=request.user
            ).exclude(client_profile__client_user=request.user)
        serializer = TaxEngagementSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = TaxEngagementSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Ensure the client_profile belongs to this accountant
        client_profile = serializer.validated_data.get("client_profile")
        if not _is_accountant_of_client(request.user, client_profile) and not request.user.is_staff:
            return Response({"detail": "You do not own this client profile."}, status=status.HTTP_403_FORBIDDEN)

        engagement = serializer.save(accountant=request.user)
        _audit(request, "engagement_created", "TaxEngagement", engagement.id,
               client_profile=engagement.client_profile, engagement=engagement)

        # Auto-generate checklist
        from apps.portal.services.accountant_checklists import create_checklist_for_engagement
        create_checklist_for_engagement(engagement)

        return Response(TaxEngagementSerializer(engagement, context={"request": request}).data, status=status.HTTP_201_CREATED)


class EngagementDetailView(APIView):
    """
    GET   /api/portal/engagements/<id>/
    PATCH /api/portal/engagements/<id>/
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_engagement(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return None, Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return eng, None

    def get(self, request, pk):
        eng, err = self._get_engagement(request, pk)
        if err:
            return err
        return Response(TaxEngagementSerializer(eng, context={"request": request}).data)

    def patch(self, request, pk):
        eng, err = self._get_engagement(request, pk)
        if err:
            return err
        serializer = TaxEngagementSerializer(
            eng, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        eng = serializer.save()

        if eng.status == "ready_to_file" and eng.readiness_score < 85:
            return Response(
                {"detail": (
                    f"Readiness score is {eng.readiness_score}%. "
                    "A score of 85% or higher is required before marking as ready to file."
                )},
                status=status.HTTP_400_BAD_REQUEST,
            )

        _audit(request, "engagement_updated", "TaxEngagement", eng.id,
               client_profile=eng.client_profile, engagement=eng)

        if eng.status == "ready_to_file" and eng.client_profile.client_user_id:
            lang = eng.client_profile.preferred_language or "nl"
            TITLES = {
                "nl": "Uw aangifte is klaar voor indiening",
                "en": "Your tax return is ready to file",
                "fa": "اظهارنامه مالیاتی شما آماده ارسال است",
            }
            create_notification(
                user=eng.client_profile.client_user,
                notif_type="engagement_ready",
                title=TITLES.get(lang, TITLES["en"]),
                body="",
                action_url="/client",
                metadata={"engagement_id": eng.id},
            )

        return Response(TaxEngagementSerializer(eng, context={"request": request}).data)

    def delete(self, request, pk):
        eng, err = self._get_engagement(request, pk)
        if err:
            return err
        if not _is_accountant_of_client(request.user, eng.client_profile) and not request.user.is_staff:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if eng.status != "draft":
            return Response(
                {"detail": "Only draft engagements can be deleted. Archive or complete the engagement first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if eng.documents.exists():
            return Response(
                {"detail": "Cannot delete engagement with uploaded documents."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _audit(request, "engagement_deleted", "TaxEngagement", eng.id,
               client_profile=eng.client_profile, engagement=eng)
        eng.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Checklist ─────────────────────────────────────────────────────────────────

class ChecklistView(APIView):
    """
    GET  /api/portal/engagements/<id>/checklist/
    POST /api/portal/engagements/<id>/checklist/regenerate/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        items = ChecklistItem.objects.filter(engagement=eng).order_by("-required", "priority", "created_at")
        return Response(ChecklistItemSerializer(items, many=True).data)

    def post(self, request, pk):
        """Regenerate / top-up checklist (idempotent)."""
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _is_accountant_of_client(request.user, eng.client_profile) and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        from apps.portal.services.accountant_checklists import create_checklist_for_engagement
        count = create_checklist_for_engagement(eng)
        _audit(request, "checklist_regenerated", "TaxEngagement", eng.id, engagement=eng)
        return Response({"created": count})


class ChecklistItemDetailView(APIView):
    """PATCH /api/portal/checklist/<id>/"""
    permission_classes = [permissions.IsAuthenticated]

    ACCOUNTANT_ALLOWED_TRANSITIONS = {
        "todo":           ["todo", "waiting_client", "waived"],
        "waiting_client": ["waiting_client", "waived"],
        "uploaded":       ["uploaded", "needs_review", "accepted", "rejected", "waived"],
        "needs_review":   ["needs_review", "accepted", "rejected", "waived"],
        "accepted":       ["accepted", "waived"],
        "rejected":       ["rejected", "todo"],
        "waived":         ["waived", "todo"],
    }

    def patch(self, request, pk):
        item = get_object_or_404(ChecklistItem, pk=pk)
        if not _can_access_engagement(request.user, item.engagement):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        new_status = request.data.get("status")
        if new_status and new_status != item.status:
            allowed = self.ACCOUNTANT_ALLOWED_TRANSITIONS.get(item.status, [])
            if new_status not in allowed:
                return Response(
                    {"detail": f"Cannot transition from '{item.status}' to '{new_status}'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        before_status = item.status
        serializer = ChecklistItemSerializer(item, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        item = serializer.save()
        _audit(request, "checklist_item_changed", "ChecklistItem", item.id,
               client_profile=item.client_profile, engagement=item.engagement,
               before={"status": before_status}, after={"status": item.status})
        return Response(ChecklistItemSerializer(item).data)


# ── Document Requests ─────────────────────────────────────────────────────────

class DocumentRequestListView(APIView):
    """
    GET  /api/portal/engagements/<id>/document-requests/
    POST /api/portal/engagements/<id>/document-requests/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        requests = DocumentRequest.objects.filter(engagement=eng)
        return Response(DocumentRequestSerializer(requests, many=True).data)

    def post(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _is_accountant_of_client(request.user, eng.client_profile) and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        data["engagement"] = eng.id
        data["client_profile"] = eng.client_profile_id
        serializer = DocumentRequestSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        req = serializer.save(created_by="accountant")
        _audit(request, "document_request_created", "DocumentRequest", req.id,
               client_profile=eng.client_profile, engagement=eng)
        return Response(DocumentRequestSerializer(req).data, status=status.HTTP_201_CREATED)


class DocumentRequestDetailView(APIView):
    """PATCH /api/portal/document-requests/<id>/"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        req = get_object_or_404(DocumentRequest, pk=pk)
        if not _can_access_engagement(request.user, req.engagement):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = DocumentRequestSerializer(req, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        req = serializer.save()
        return Response(DocumentRequestSerializer(req).data)


# ── Document Upload & Review ──────────────────────────────────────────────────

class ClientDocumentUploadView(APIView):
    """POST /api/portal/documents/upload/"""
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ClientDocumentUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        engagement     = serializer.validated_data["engagement"]
        client_profile = serializer.validated_data["client_profile"]

        # Permission: client or accountant can upload
        if not _can_access_engagement(request.user, engagement):
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        # Verify client_profile belongs to engagement
        if client_profile.id != engagement.client_profile_id:
            return Response({"detail": "client_profile does not match engagement."}, status=status.HTTP_400_BAD_REQUEST)

        # Resolve optional checklist_item_id sent from the client task page
        checklist_item_obj = None
        checklist_item_id = request.data.get("checklist_item_id")
        if checklist_item_id:
            try:
                checklist_item_obj = ChecklistItem.objects.get(
                    id=int(checklist_item_id), engagement=engagement
                )
            except (ChecklistItem.DoesNotExist, ValueError, TypeError):
                pass

        uploaded_file = serializer.validated_data["file"]
        try:
            doc = ClientDocument.objects.create(
                engagement=engagement,
                client_profile=client_profile,
                document_request=serializer.validated_data.get("document_request"),
                checklist_item=checklist_item_obj,
                uploaded_by=request.user,
                original_filename=uploaded_file.name,
                user_title=serializer.validated_data.get("user_title", ""),
                user_note=serializer.validated_data.get("user_note", ""),
                file=uploaded_file,
                mime_type=uploaded_file.content_type or "application/octet-stream",
                file_size=uploaded_file.size,
                processing_status="uploaded",
            )
        except Exception as exc:
            return Response({"detail": f"Upload failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Auto-link: if no document_request supplied (generic upload page),
        # try to find the single open DocumentRequest on this engagement.
        if checklist_item_obj is None and not doc.document_request:
            open_reqs = DocumentRequest.objects.filter(engagement=engagement, status="open")
            if open_reqs.count() == 1:
                dr = open_reqs.first()
                doc.document_request = dr
                doc.save(update_fields=["document_request"])

        # Auto-link checklist item via shared stable_key with the document_request
        if checklist_item_obj is None and doc.document_request:
            stable_key = doc.document_request.stable_key
            if stable_key:
                linked = ChecklistItem.objects.filter(
                    engagement=engagement,
                    stable_key=stable_key,
                ).first()
                if linked:
                    doc.checklist_item = linked
                    doc.save(update_fields=["checklist_item"])
                    checklist_item_obj = linked

        if checklist_item_obj and checklist_item_obj.status in ("todo", "waiting_client"):
            checklist_item_obj.status = "uploaded"
            checklist_item_obj.save(update_fields=["status", "updated_at"])

        _audit(request, "document_uploaded", "ClientDocument", doc.id,
               client_profile=client_profile, engagement=engagement,
               after={"filename": doc.original_filename, "size": doc.file_size})

        # Notify accountant that a new document has been uploaded
        if engagement.accountant_id and engagement.accountant_id != request.user.pk:
            client_name = client_profile.first_name or client_profile.email or "Your client"
            create_notification(
                user=engagement.accountant,
                notif_type="document_uploaded",
                title="New document uploaded",
                body=f'{client_name} uploaded "{doc.user_title or doc.original_filename}".',
                action_url=f"/accountant/engagements/{engagement.id}",
                metadata={"engagement_id": engagement.id, "document_id": doc.id},
            )

        # Update any linked document_request status
        if doc.document_request:
            req = doc.document_request
            if req.status == "open":
                req.status = "uploaded"
                req.save(update_fields=["status"])

        # Queue async AI extraction — never blocks the upload response
        try:
            from apps.portal.tasks import process_document_task
            process_document_task.delay(doc.id)
        except Exception:
            pass

        return Response(ClientDocumentSerializer(doc, context={"request": request}).data, status=status.HTTP_201_CREATED)


class EngagementDocumentsView(APIView):
    """GET /api/portal/engagements/<id>/documents/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        docs = ClientDocument.objects.filter(engagement=eng)
        return Response(ClientDocumentSerializer(docs, many=True, context={"request": request}).data)


class DocumentReviewView(APIView):
    """PATCH /api/portal/documents/<id>/review/"""
    permission_classes = [permissions.IsAuthenticated]

    # Rejection notification text in all three supported languages
    _REJECTION_MSG = {
        "nl": "Uw document '{title}' is afgewezen door uw accountant.{note} Upload een gecorrigeerde versie via 'Mijn taken'.",
        "en": "Your document '{title}' has been rejected by your accountant.{note} Please re-upload a corrected version from 'My tasks'.",
        "fa": "سند '{title}' شما توسط حسابدارتان رد شد.{note} لطفاً نسخه اصلاح‌شده را از طریق 'وظایف من' مجدداً بارگذاری کنید.",
    }

    def patch(self, request, pk):
        doc = get_object_or_404(ClientDocument, pk=pk)
        if not _is_accountant_of_client(request.user, doc.client_profile) and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get("processing_status")
        review_notes = request.data.get("review_notes", doc.review_notes)

        if new_status == "rejected" and not (review_notes or "").strip():
            return Response(
                {"detail": "A rejection reason (review_notes) is required when rejecting a document."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status:
            allowed = [c[0] for c in ClientDocument.PROCESSING_STATUS_CHOICES]
            if new_status not in allowed:
                return Response({"detail": f"Invalid status. Choose from: {allowed}"}, status=status.HTTP_400_BAD_REQUEST)
            doc.processing_status = new_status
            doc.review_notes = review_notes
            doc.save(update_fields=["processing_status", "review_notes"])

            _audit(request, f"document_{new_status}", "ClientDocument", doc.id,
                   client_profile=doc.client_profile, engagement=doc.engagement,
                   after={"status": new_status, "notes": review_notes})

            # ── Cascade to linked ChecklistItem and DocumentRequest ────────────
            # Primary: direct FK set at upload time (covers task-page uploads)
            # Fallback: match via document_request → stable_key (covers accountant-initiated requests)
            linked_item = doc.checklist_item
            if linked_item is None and doc.document_request and doc.document_request.stable_key:
                linked_item = ChecklistItem.objects.filter(
                    engagement=doc.engagement,
                    stable_key=doc.document_request.stable_key,
                ).first()

            if new_status == "rejected":
                # Reopen the DocumentRequest so the client can re-upload
                if doc.document_request and doc.document_request.status != "open":
                    doc.document_request.status = "open"
                    doc.document_request.save(update_fields=["status"])

                # Reset the ChecklistItem back to "todo" so it reappears as active
                if linked_item and linked_item.status not in ("accepted", "waived"):
                    linked_item.status = "todo"
                    linked_item.save(update_fields=["status"])

                # Notify the client via in-app message (in their preferred language)
                try:
                    doc_title = doc.user_title or doc.original_filename or "document"
                    lang = doc.client_profile.preferred_language or "nl"
                    note_part = f" Reden: {review_notes}" if review_notes else ""
                    if lang == "en":
                        note_part = f" Reason: {review_notes}" if review_notes else ""
                    elif lang == "fa":
                        note_part = f" دلیل: {review_notes}" if review_notes else ""
                    msg_tmpl = self._REJECTION_MSG.get(lang, self._REJECTION_MSG["en"])
                    body = msg_tmpl.format(title=doc_title, note=note_part)
                    PortalMessage.objects.create(
                        engagement=doc.engagement,
                        client_profile=doc.client_profile,
                        sender=request.user,
                        body=body,
                    )
                    # In-app notification for the client
                    if doc.client_profile.client_user_id:
                        create_notification(
                            user=doc.client_profile.client_user,
                            notif_type="document_rejected",
                            title="Document rejected",
                            body=body,
                            action_url="/client/tasks",
                            metadata={"engagement_id": doc.engagement_id, "document_id": doc.id},
                        )
                except Exception:
                    pass  # Notification failure must never block the review action

            elif new_status == "approved":
                # Advance the DocumentRequest to accepted
                if doc.document_request and doc.document_request.status not in ("accepted", "waived"):
                    doc.document_request.status = "accepted"
                    doc.document_request.save(update_fields=["status"])

                # Mark the ChecklistItem as accepted
                if linked_item and linked_item.status not in ("accepted", "waived"):
                    linked_item.status = "accepted"
                    linked_item.save(update_fields=["status"])

                # Notify client that document was approved
                if doc.client_profile.client_user_id:
                    doc_title = doc.user_title or doc.original_filename or "document"
                    lang = doc.client_profile.preferred_language or "nl"
                    APPROVED_TITLE = {"nl": "Document goedgekeurd", "en": "Document approved", "fa": "سند تأیید شد"}
                    APPROVED_BODY = {
                        "nl": f"Uw document '{doc_title}' is goedgekeurd door uw accountant.",
                        "en": f"Your document '{doc_title}' has been approved by your accountant.",
                        "fa": f"سند '{doc_title}' شما توسط حسابدارتان تأیید شد.",
                    }
                    try:
                        create_notification(
                            user=doc.client_profile.client_user,
                            notif_type="document_approved",
                            title=APPROVED_TITLE.get(lang, APPROVED_TITLE["en"]),
                            body=APPROVED_BODY.get(lang, APPROVED_BODY["en"]),
                            action_url="/client/tasks",
                            metadata={"engagement_id": doc.engagement_id, "document_id": doc.id},
                        )
                    except Exception:
                        pass

        # Refresh missing_items_count on the engagement after any review action
        if new_status:
            try:
                eng = doc.engagement
                missing = ChecklistItem.objects.filter(
                    engagement=eng,
                    required=True,
                    status__in=("todo", "waiting_client", "rejected"),
                ).count()
                TaxEngagement.objects.filter(pk=eng.pk).update(missing_items_count=missing)
            except Exception:
                pass

        return Response(ClientDocumentSerializer(doc, context={"request": request}).data)


class DocumentFileView(APIView):
    """
    GET /api/portal/documents/<id>/file/
    Streams the uploaded file back to the authenticated caller.
    Accountants can view their clients' files; clients can view their own.
    Returns a clean JSON 404 (not a raw Django 404 page or a 500) if the file
    is missing or unreadable from storage (e.g. a stale row pointing at a file
    that was lost from local disk before FILE_STORAGE_PROVIDER=s3 was enabled,
    or a transient error talking to the S3-compatible bucket).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        doc = get_object_or_404(ClientDocument, pk=pk)

        # Permission: staff, accountant of this client, or the client themselves
        if not request.user.is_staff:
            if not (_is_accountant_of_client(request.user, doc.client_profile)
                    or _is_client_of_profile(request.user, doc.client_profile)):
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if not doc.file:
            return Response({"detail": "No file attached to this document."}, status=status.HTTP_404_NOT_FOUND)

        try:
            INLINE_TYPES = {
                "application/pdf", "image/jpeg", "image/jpg", "image/png",
                "image/webp", "image/heic", "image/heif",
            }
            as_attachment = doc.mime_type not in INLINE_TYPES
            fh = doc.file.open("rb")
            response = FileResponse(
                fh,
                content_type=doc.mime_type or "application/octet-stream",
                as_attachment=as_attachment,
                filename=doc.original_filename or "document",
            )
            return response
        except Exception as exc:
            # Broad on purpose: FileSystemStorage raises FileNotFoundError/OSError,
            # but S3-backed storage raises botocore.exceptions.ClientError (not an
            # OSError subclass) for a missing key or bucket/credential problem. Any
            # of these should degrade to the same clean, actionable 404.
            logger.warning("Document %s file unreadable from storage: %s", doc.pk, exc)
            return Response(
                {"detail": "File not found on server. It may have been lost after a deployment. Please re-upload."},
                status=status.HTTP_404_NOT_FOUND,
            )


# ── Extracted Income / Expense ────────────────────────────────────────────────

class ExtractedIncomeView(APIView):
    """GET + PATCH /api/portal/engagements/<id>/income/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ExtractedIncomeSerializer(eng.income_items.all(), many=True).data)

    def post(self, request, pk):
        """Manually add income row."""
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data["engagement"] = eng.id
        data["client_profile"] = eng.client_profile_id
        data["review_status"] = "manual"
        serializer = ExtractedIncomeSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        income = serializer.save()
        return Response(ExtractedIncomeSerializer(income).data, status=status.HTTP_201_CREATED)


class ExtractedIncomeDetailView(APIView):
    """PATCH /api/portal/income/<id>/"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        income = get_object_or_404(ExtractedIncome, pk=pk)
        if not _can_access_engagement(request.user, income.engagement):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        before_status = income.review_status
        serializer = ExtractedIncomeSerializer(income, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        income = serializer.save()
        if income.review_status != before_status:
            _audit(request, f"income_{income.review_status}", "ExtractedIncome", income.id,
                   client_profile=income.client_profile, engagement=income.engagement,
                   before={"status": before_status}, after={"status": income.review_status})
        return Response(ExtractedIncomeSerializer(income).data)


class ExtractedExpenseView(APIView):
    """GET + POST /api/portal/engagements/<id>/expenses/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ExtractedExpenseSerializer(eng.expense_items.all(), many=True).data)

    def post(self, request, pk):
        """Manually add expense row."""
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        data = request.data.copy()
        data["engagement"] = eng.id
        data["client_profile"] = eng.client_profile_id
        data["review_status"] = "manual"
        serializer = ExtractedExpenseSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        expense = serializer.save()
        return Response(ExtractedExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)


class ExtractedExpenseDetailView(APIView):
    """PATCH /api/portal/expenses/<id>/"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        expense = get_object_or_404(ExtractedExpense, pk=pk)
        if not _can_access_engagement(request.user, expense.engagement):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        before_status = expense.review_status
        serializer = ExtractedExpenseSerializer(expense, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        expense = serializer.save()
        if expense.review_status != before_status:
            _audit(request, f"expense_{expense.review_status}", "ExtractedExpense", expense.id,
                   client_profile=expense.client_profile, engagement=expense.engagement,
                   before={"status": before_status}, after={"status": expense.review_status})
        return Response(ExtractedExpenseSerializer(expense).data)


# ── Actions ───────────────────────────────────────────────────────────────────

class AccountantActionsView(APIView):
    """
    GET  /api/portal/engagements/<id>/actions/
    POST /api/portal/engagements/<id>/generate-actions/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        actions = AccountantAction.objects.filter(engagement=eng).order_by("-priority", "-created_at")
        return Response(AccountantActionSerializer(actions, many=True).data)

    def post(self, request, pk):
        """Generate actions (rule engine + AI suggestions)."""
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _is_accountant_of_client(request.user, eng.client_profile) and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        from apps.portal.services.accountant_actions import generate_accountant_actions
        result = generate_accountant_actions(eng)
        _audit(request, "actions_generated", "TaxEngagement", eng.id, engagement=eng)

        # Notify client that new tasks are available
        if eng.client_profile.client_user_id:
            lang = eng.client_profile.preferred_language or "nl"
            TITLES = {"nl": "Nieuwe taken beschikbaar", "en": "New tasks available", "fa": "وظایف جدید در دسترس است"}
            BODIES = {
                "nl": "Uw accountant heeft nieuwe taken gegenereerd voor uw belastingdossier.",
                "en": "Your accountant has generated new tasks for your tax file.",
                "fa": "حسابدار شما وظایف جدیدی برای پرونده مالیاتی شما ایجاد کرده است.",
            }
            create_notification(
                user=eng.client_profile.client_user,
                notif_type="checklist_update",
                title=TITLES.get(lang, TITLES["en"]),
                body=BODIES.get(lang, BODIES["en"]),
                action_url="/client/tasks",
                metadata={"engagement_id": eng.id},
            )

        return Response(result)


class AccountantActionDetailView(APIView):
    """PATCH /api/portal/actions/<id>/"""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        action = get_object_or_404(AccountantAction, pk=pk)
        if not _can_access_engagement(request.user, action.engagement):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AccountantActionSerializer(action, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        action = serializer.save()
        return Response(AccountantActionSerializer(action).data)


# ── Readiness ─────────────────────────────────────────────────────────────────

class ReadinessView(APIView):
    """POST /api/portal/engagements/<id>/recalculate-readiness/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        from apps.portal.services.readiness import calculate_readiness
        result = calculate_readiness(eng)
        return Response(result)


# ── Risks & Deductions ────────────────────────────────────────────────────────

class RisksDeductionsView(APIView):
    """GET /api/portal/engagements/<id>/risks/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        result = _build_risks_and_deductions(eng)
        return Response(result)


def _build_risks_and_deductions(engagement) -> dict:
    """
    Build deduction opportunities and risk warnings for a given engagement.
    Flags are: likely / needs_confirmation / not_enough_info / needs_accountant_review
    """
    profile = engagement.client_profile
    ct = profile.client_type or "other"

    checklist_map = {
        item.stable_key: item.status
        for item in ChecklistItem.objects.filter(engagement=engagement)
    }

    def has(key): return checklist_map.get(key) in ("accepted", "waived", "uploaded")

    opportunities = []
    risks = []

    if ct == "zzp":
        hours_ok = has("zzp_hours") or has("det_zzp_hours")
        opportunities.append({
            "id": "zelfstandigenaftrek",
            "title": "Zelfstandigenaftrek €1,200",
            "description": "Deduction for self-employed workers with 1,225+ hours/year.",
            "confidence": "likely" if hours_ok else "needs_confirmation",
            "rule_id": "ZA-2026-001",
            "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/ondernemersaftrek/zelfstandigenaftrek/",
        })
        opportunities.append({
            "id": "mkb_winstvrijstelling",
            "title": "MKB-winstvrijstelling 12.7%",
            "description": "12.7% profit exemption after ondernemersaftrek. No hours requirement.",
            "confidence": "likely",
            "rule_id": "MKB-2026-001",
            "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/ondernemersaftrek/mkb_winstvrijstelling/",
        })
        kia_ok = has("zzp_kia")
        opportunities.append({
            "id": "kia",
            "title": "Kleinschaligheidsinvesteringsaftrek (KIA) 28%",
            "description": "28% deduction on business investments €2,901–€70,602.",
            "confidence": "needs_confirmation" if kia_ok else "not_enough_info",
            "rule_id": "KIA-2026-001",
            "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/ondernemersaftrek/investeringsaftrek/kleinschaligheidsinvesteringsaftrek/",
        })
        pension_ok = has("zzp_pension")
        opportunities.append({
            "id": "lijfrente",
            "title": "Pension / lijfrente jaarruimte",
            "description": "ZZP workers can deduct voluntary pension premiums (30% × (income − €19,172)).",
            "confidence": "needs_confirmation" if pension_ok else "not_enough_info",
            "rule_id": "LR-2026-001",
            "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/",
        })
        opportunities.append({
            "id": "zvw_reminder",
            "title": "ZVW bijdrage 4.85%",
            "description": "Health insurance contribution on ZZP profit — often forgotten. Max €3,851/year.",
            "confidence": "likely",
            "rule_id": "ZVW-2026-001",
            "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/",
        })
        # Wet DBA risk
        wetdba_ok = has("zzp_wet_dba_clients")
        risks.append({
            "id": "wet_dba",
            "title": "Wet DBA enforcement risk",
            "description": "Active enforcement since Jan 2025. Single client >65% = medium risk.",
            "level": "needs_confirmation" if wetdba_ok else "not_enough_info",
            "rule_id": "WD-2026-001",
            "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/ondernemen/",
        })
        if not has("zzp_hours"):
            risks.append({
                "id": "hours_missing",
                "title": "Hours registration not confirmed",
                "description": "Zelfstandigenaftrek is at risk if 1,225 hours cannot be proven.",
                "level": "needs_accountant_review",
                "rule_id": "ZA-2026-001",
                "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/winst/ondernemersaftrek/zelfstandigenaftrek/",
            })

    elif ct == "employee":
        if not has("emp_jaaropgave"):
            risks.append({
                "id": "jaaropgave_missing",
                "title": "Jaaropgave not received",
                "description": "Cannot complete IB return without the annual income statement.",
                "level": "needs_accountant_review",
                "rule_id": "BR1-2026-001",
                "source_url": "https://www.belastingdienst.nl",
            })
        pension_ok = has("emp_pension")
        opportunities.append({
            "id": "lijfrente",
            "title": "Pension / lijfrente deduction",
            "description": "Voluntary pension premiums may be deductible via jaarruimte calculation.",
            "confidence": "needs_confirmation" if pension_ok else "not_enough_info",
            "rule_id": "LR-2026-001",
            "source_url": "https://www.belastingdienst.nl",
        })
        mortgage_ok = has("emp_mortgage")
        opportunities.append({
            "id": "mortgage_interest",
            "title": "Hypotheekrenteaftrek",
            "description": "Mortgage interest deduction if client is homeowner.",
            "confidence": "likely" if mortgage_ok else "not_enough_info",
            "rule_id": "BR1-2026-001",
            "source_url": "https://www.belastingdienst.nl",
        })
        box3 = has("emp_box3_bank") or has("emp_box3_investments")
        opportunities.append({
            "id": "box3_exemption",
            "title": f"Box 3 exemption €{BOX3_VRIJSTELLING:,}",
            "description": f"Assets below €{BOX3_VRIJSTELLING:,}/person are exempt from Box 3 wealth tax.",
            "confidence": "needs_confirmation" if box3 else "not_enough_info",
            "rule_id": "B3R-2026-001",
            "source_url": "https://www.belastingdienst.nl",
        })

    elif ct == "expat":
        ruling_ok = has("exp_30pct_ruling")
        opportunities.append({
            "id": "30pct_ruling",
            "title": "30% ruling expat exemption",
            "description": "Years 1-3: 30%, Year 4: 20%, Year 5: 10% exemption on salary.",
            "confidence": "likely" if ruling_ok else "needs_confirmation",
            "rule_id": "EXP-2026-001",
            "source_url": "https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/werk_en_inkomen/buitenlandse_werknemers_in_nederland/",
        })
        mform_ok = has("exp_m_form")
        risks.append({
            "id": "m_form",
            "title": "M-form for partial-year resident",
            "description": "If arrived after 1 Jan, M-form applies. Risk of incorrect form type.",
            "level": "needs_confirmation" if mform_ok else "needs_accountant_review",
            "rule_id": "DL-2026-002",
            "source_url": "https://www.belastingdienst.nl",
        })
        foreign_assets = has("exp_foreign_assets")
        risks.append({
            "id": "foreign_assets",
            "title": "Foreign assets Box 3 reporting",
            "description": "Foreign bank accounts and property must be reported on 1 January reference date.",
            "level": "needs_confirmation" if foreign_assets else "not_enough_info",
            "rule_id": "B3R-2026-001",
            "source_url": "https://www.belastingdienst.nl",
        })

    elif ct == "dga":
        salary_ok = has("dga_salary") or has("det_dga_salary")
        risks.append({
            "id": "gebruikelijk_loon",
            "title": f"Gebruikelijk loon €{DGA_GEBRUIKELIJK_LOON_MIN:,} minimum (2026)",
            "description": f"DGA must pay at least €{DGA_GEBRUIKELIJK_LOON_MIN:,} salary in 2026. Lower = risk of Belastingdienst correction.",
            "level": "needs_confirmation" if salary_ok else "needs_accountant_review",
            "rule_id": "DGA-2026-001",
            "source_url": "https://www.belastingdienst.nl",
        })
        dividend_ok = has("dga_dividend")
        opportunities.append({
            "id": "dividend_box2",
            "title": f"Box 2 dividend — {BOX2_RATE_LOW}% up to €{BOX2_RATE_LOW_THRESHOLD:,}",
            "description": f"Lower Box 2 rate applies on first €{BOX2_RATE_LOW_THRESHOLD:,} of dividend income.",
            "confidence": "likely" if dividend_ok else "needs_confirmation",
            "rule_id": "B2R-2026-001",
            "source_url": "https://www.belastingdienst.nl",
        })

    return {
        "client_type": ct,
        "opportunities": opportunities,
        "risks": risks,
    }


# ── Reminder / Notification ───────────────────────────────────────────────────

class PortalReminderView(APIView):
    """POST /api/portal/engagements/<id>/send-reminder/"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _is_accountant_of_client(request.user, eng.client_profile) and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        profile = eng.client_profile
        lang = profile.preferred_language or "en"

        # Build missing items list
        missing = list(ChecklistItem.objects.filter(
            engagement=eng, required=True, status__in=("todo", "waiting_client", "rejected")
        ).values_list("title", flat=True))

        SUBJECT = {
            "nl": f"Ontbrekende documenten voor uw belastingaangifte {eng.tax_year}",
            "en": f"Missing information for your Dutch tax file {eng.tax_year}",
            "fa": f"اطلاعات ناقص برای پرونده مالیاتی {eng.tax_year} شما",
        }
        GREETING = {
            "nl": f"Beste {profile.first_name or 'klant'},",
            "en": f"Dear {profile.first_name or 'client'},",
            "fa": f"با احترام {profile.first_name or 'مشتری گرامی'},",
        }
        INTRO = {
            "nl": f"Voor uw belastingaangifte {eng.tax_year} hebben wij nog de volgende informatie nodig:",
            "en": f"We still need the following items for your {eng.tax_year} tax file:",
            "fa": f"برای پرونده مالیاتی {eng.tax_year} شما هنوز به موارد زیر نیاز داریم:",
        }
        CLOSING = {
            "nl": "Upload deze documenten via uw TaxWijs client portal.\n\nMet vriendelijke groet,\n{accountant}",
            "en": "Please upload them through your TaxWijs client portal.\n\nKind regards,\n{accountant}",
            "fa": "لطفاً آن‌ها را از طریق پورتال TaxWijs آپلود کنید.\n\nبا احترام،\n{accountant}",
        }

        accountant_name = request.user.get_full_name() or request.user.email
        items_text = "\n".join(f"• {item}" for item in missing) if missing else "—"

        body = (
            f"{GREETING[lang]}\n\n"
            f"{INTRO[lang]}\n\n"
            f"{items_text}\n\n"
            f"{CLOSING[lang].format(accountant=accountant_name)}"
        )

        # Persist ReminderLog so the accountant inbox can show it
        ReminderLog.objects.create(
            engagement=eng,
            client_profile=profile,
            sent_by=request.user,
            reminder_type="document_request",
            channel="in_app",
            subject=SUBJECT[lang],
            body=body,
            delivered=True,
        )

        # Deliver as an in-app message so the client sees it in their Messages tab
        PortalMessage.objects.create(
            engagement=eng,
            client_profile=profile,
            sender=request.user,
            body=body,
        )

        # Send a Web Push notification if the client has a TaxWijs account and has subscribed
        missing_count = len(missing)
        if profile.client_user_id:
            PUSH_TITLE = {
                "nl": "Actie vereist — ontbrekende documenten",
                "en": "Action required — missing documents",
                "fa": "اقدام لازم — مدارک ناقص",
            }
            PUSH_BODY = {
                "nl": f"{missing_count} document(en) nodig voor uw belastingaangifte {eng.tax_year}.",
                "en": f"{missing_count} document(s) needed for your {eng.tax_year} tax file.",
                "fa": f"{missing_count} سند برای پرونده مالیاتی {eng.tax_year} شما لازم است.",
            }
            push_title = PUSH_TITLE.get(lang, PUSH_TITLE["en"])
            push_body  = PUSH_BODY.get(lang, PUSH_BODY["en"])
            send_push_notification(
                user=profile.client_user,
                title=push_title,
                body=push_body,
                url="/client/messages",
            )
            # Also create an in-app notification record
            create_notification(
                user=profile.client_user,
                notif_type="system",
                title=push_title,
                body=push_body,
                action_url="/client/messages",
                metadata={"engagement_id": eng.id, "missing_count": missing_count},
            )

        _audit(request, "reminder_sent", "TaxEngagement", eng.id,
               client_profile=profile, engagement=eng,
               after={"missing_count": missing_count, "lang": lang})

        return Response({
            "subject": SUBJECT[lang],
            "body": body,
            "recipient": profile.email,
            "missing_count": missing_count,
            "sent": True,
            "preview": False,
        })


# ── Audit Log ─────────────────────────────────────────────────────────────────

class AuditLogView(APIView):
    """GET /api/portal/engagements/<id>/audit/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _is_accountant_of_client(request.user, eng.client_profile) and not request.user.is_staff:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)
        logs = PortalAuditLog.objects.filter(engagement=eng).order_by("-created_at")[:100]
        return Response(PortalAuditLogSerializer(logs, many=True).data)


# ── Client Portal views (self-service) ───────────────────────────────────────

def _get_or_create_self_service_profile(user):
    """
    Return the best AccountantClientProfile for this user.
    Prefers accountant-managed profiles over self-managed ones.
    Creates a self-managed profile + engagement if none exist.
    """
    # First prefer profiles created by a *different* accountant (real engagement)
    profile = AccountantClientProfile.objects.filter(
        client_user=user
    ).exclude(
        accountant_user=user
    ).order_by("-created_at").first()

    if not profile:
        # Fall back to self-managed profile
        profile = AccountantClientProfile.objects.filter(
            client_user=user,
            accountant_user=user,
        ).order_by("-created_at").first()

    if not profile:
        # Create a self-managed profile so the portal is immediately usable
        profile = AccountantClientProfile.objects.create(
            accountant_user=user,
            client_user=user,
            email=user.email,
            first_name=getattr(user, "first_name", ""),
            last_name=getattr(user, "last_name", ""),
            status="active",
            client_type="other",
        )

    return profile


def _get_or_create_engagement(profile):
    """Return the latest engagement for profile, creating one if none exists."""
    engagement = profile.engagements.order_by("-created_at").first()
    if not engagement:
        engagement = TaxEngagement.objects.create(
            accountant=profile.accountant_user,
            client_profile=profile,
            status="collecting",
            tax_year=2026,
        )
        from apps.portal.services.accountant_checklists import create_checklist_for_engagement
        try:
            create_checklist_for_engagement(engagement)
        except Exception:
            pass
    return engagement


class ClientPortalProfileView(APIView):
    """
    GET   /api/portal/client/profile/  — returns (or auto-creates) the client's portal profile
    PATCH /api/portal/client/profile/  — update preferred_language (synced from UI language switcher)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = _get_or_create_self_service_profile(request.user)
        return Response(AccountantClientProfileSerializer(profile, context={"request": request}).data)

    def patch(self, request):
        profile = _get_or_create_self_service_profile(request.user)
        allowed = {
            "preferred_language", "first_name", "last_name", "full_name", "phone",
            "address_street", "address_city", "address_postcode",
            "bsn", "kvk_number", "btw_number", "birth_date",
            "tax_type", "notes",
        }
        data = {k: v for k, v in request.data.items() if k in allowed}
        if not data:
            return Response({"detail": "No updatable fields."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = AccountantClientProfileSerializer(profile, data=data, partial=True, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(AccountantClientProfileSerializer(profile, context={"request": request}).data)


class ClientPortalEngagementView(APIView):
    """GET /api/portal/client/engagement/  — client's active engagement (auto-created if missing)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = _get_or_create_self_service_profile(request.user)
        engagement = _get_or_create_engagement(profile)
        return Response(TaxEngagementSerializer(engagement, context={"request": request}).data)


class ClientPortalTasksView(APIView):
    """GET /api/portal/client/tasks/  — all checklist items for client (all statuses)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = _get_or_create_self_service_profile(request.user)
        engagement = _get_or_create_engagement(profile)
        if not engagement:
            return Response({"tasks": [], "total": 0, "completed": 0, "readiness_score": 0})

        # Return all ChecklistItems (all statuses so the frontend can split open/done).
        # DocumentRequests are excluded — they are internal accountant tracking records;
        # including both caused duplicate entries for the same task.
        checklist_items = ChecklistItem.objects.filter(
            engagement=engagement
        ).order_by("-required", "priority", "created_at")

        # Pre-fetch all rejected documents for this engagement in one query so we
        # can attach rejection_note to tasks without N+1 queries.
        rejected_docs = (
            ClientDocument.objects
            .filter(engagement=engagement, processing_status="rejected", document_request__isnull=False)
            .select_related("document_request")
            .order_by("-updated_at")
        )
        rejection_by_stable_key: dict[str, str] = {}
        for rdoc in rejected_docs:
            sk = rdoc.document_request.stable_key
            if sk and sk not in rejection_by_stable_key:
                rejection_by_stable_key[sk] = rdoc.review_notes or "Document was rejected. Please re-upload."

        tasks = []
        for item in checklist_items:
            # Only surface the rejection note when the task is actively awaiting
            # resubmission (status == "todo"). Once re-uploaded it clears naturally.
            rejection_note = (
                rejection_by_stable_key.get(item.stable_key or "")
                if item.status == "todo" else None
            )
            tasks.append({
                "id": f"chk_{item.id}",
                "type": "checklist",
                "title": item.title,
                "description": item.description,
                "category": item.category,
                "required": item.required,
                "status": item.status,
                "priority": item.priority,
                "stable_key": item.stable_key,
                "meta_value": item.meta_value,
                "rejection_note": rejection_note,
                "due_date": None,
            })

        total = ChecklistItem.objects.filter(engagement=engagement, required=True).count()
        completed = ChecklistItem.objects.filter(
            engagement=engagement, required=True, status__in=("accepted", "waived")
        ).count()

        # Include the most recent ReadinessSnapshot component scores so the
        # client portal can display accurate per-factor breakdowns.
        snapshot = engagement.readiness_snapshots.order_by("-computed_at").first()
        readiness_components = {
            "doc_score":              snapshot.doc_score              if snapshot else None,
            "checklist_score":        snapshot.checklist_score        if snapshot else None,
            "verification_score":     snapshot.verification_score     if snapshot else None,
            "accountant_review_score":snapshot.accountant_review_score if snapshot else None,
        }

        return Response({
            "tasks": tasks,
            "total": total,
            "completed": completed,
            "readiness_score": engagement.readiness_score,
            "readiness_components": readiness_components,
        })


class ClientPortalDocumentsView(APIView):
    """GET /api/portal/client/documents/"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = _get_or_create_self_service_profile(request.user)
        docs = ClientDocument.objects.filter(client_profile=profile).order_by("-created_at")
        return Response(ClientDocumentSerializer(docs, many=True, context={"request": request}).data)


class ClientPortalDocumentDeleteView(APIView):
    """DELETE /api/portal/client/documents/<id>/  — client deletes their own document."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        doc = get_object_or_404(ClientDocument, pk=pk)
        profile = _get_or_create_self_service_profile(request.user)

        # Allow: uploader, or owner of the client profile, or accountant, or staff
        if (doc.uploaded_by_id != request.user.id
                and doc.client_profile_id != profile.id
                and not request.user.is_staff):
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        _audit(request, "document_deleted", "ClientDocument", doc.id,
               client_profile=doc.client_profile, engagement=doc.engagement,
               before={"filename": doc.original_filename})
        doc.file.delete(save=False)  # remove the actual file from disk
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ClientPortalTaskUpdateView(APIView):
    """
    PATCH /api/portal/client/tasks/<id>/
    Allows a client to mark their own checklist item as uploaded/done.
    Creates an AccountantAction to notify the accountant.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        item = get_object_or_404(ChecklistItem, pk=pk)
        profile = _get_or_create_self_service_profile(request.user)

        if item.client_profile_id != profile.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        meta_value = request.data.get("meta_value", None)

        allowed = ("uploaded", "answered", "todo")
        if new_status not in allowed:
            return Response({"detail": f"status must be one of {allowed}"}, status=status.HTTP_400_BAD_REQUEST)

        old_status = item.status
        item.status = new_status
        update_fields = ["status", "updated_at"]
        if meta_value is not None:
            item.meta_value = str(meta_value).strip()
            update_fields.append("meta_value")
        item.save(update_fields=update_fields)

        # When client saves hours, sync to ZZP workspace so the hours counter reflects it
        if item.stable_key == "zzp_hours" and meta_value:
            try:
                from apps.zzp.models import ZZPHoursEntry
                import datetime as _dt
                hours_val = float(str(meta_value).strip())
                tax_year  = item.engagement.tax_year if item.engagement else _dt.date.today().year
                # Replace any previous task-summary entry for this user+year
                ZZPHoursEntry.objects.filter(
                    user=request.user, year=tax_year, notes="task_checklist_summary"
                ).delete()
                ZZPHoursEntry.objects.create(
                    user=request.user,
                    date=_dt.date(tax_year, 12, 31),
                    hours=hours_val,
                    description="Uren totaal (urencriterium opgave)",
                    year=tax_year,
                    week=52,
                    notes="task_checklist_summary",
                )
            except Exception:
                pass  # Never block the task save if ZZP sync fails

        # Notify accountant when client marks item as done
        if new_status in ("uploaded", "answered") and old_status not in ("uploaded", "answered"):
            AccountantAction.objects.get_or_create(
                engagement=item.engagement,
                client_profile=item.client_profile,
                stable_key=f"client_done_{item.id}",
                defaults={
                    "title": f"Client completed: {item.title}",
                    "body": f"The client marked '{item.title}' as done. Please review.",
                    "action_type": "review_document",
                    "priority": "medium",
                    "source": "manual",
                    "status": "open",
                },
            )
            # Recalculate readiness score
            try:
                from apps.portal.services.readiness import calculate_readiness
                calculate_readiness(item.engagement)
            except Exception:
                pass

        _audit(request, f"client_task_{new_status}", "ChecklistItem", item.id,
               client_profile=item.client_profile, engagement=item.engagement,
               before={"status": old_status}, after={"status": new_status})

        return Response(ChecklistItemSerializer(item).data)


# ── P2.1 Accountant Inbox ─────────────────────────────────────────────────────

class AccountantInboxView(APIView):
    """
    GET /api/portal/inbox/
    Aggregated view of everything requiring accountant attention:
    - pending document uploads (needs_review)
    - open AccountantActions
    - sent ReminderLogs
    - recent PortalMessages (unread)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_portal_user(request.user) and not request.user.is_staff:
            return Response({"detail": "Portal access required."}, status=403)

        # Scope to this accountant's clients (exclude self-managed profiles)
        if request.user.is_staff:
            profiles = AccountantClientProfile.objects.all()
        else:
            profiles = AccountantClientProfile.objects.filter(
                accountant_user=request.user
            ).exclude(client_user=F("accountant_user"))

        profile_ids   = list(profiles.values_list("id", flat=True))
        engagement_qs = TaxEngagement.objects.filter(client_profile_id__in=profile_ids)
        eng_ids       = list(engagement_qs.values_list("id", flat=True))

        # Pending uploads awaiting review
        pending_docs = ClientDocument.objects.filter(
            engagement_id__in=eng_ids,
            processing_status__in=("uploaded", "needs_review"),
        ).select_related("client_profile", "uploaded_by").order_by("-created_at")[:20]

        # Open accountant actions
        open_actions = AccountantAction.objects.filter(
            engagement_id__in=eng_ids, status="open"
        ).select_related("client_profile").order_by("-priority", "-created_at")[:20]

        # Recent reminder logs
        recent_reminders = ReminderLog.objects.filter(
            engagement_id__in=eng_ids
        ).select_related("client_profile").order_by("-created_at")[:10]

        # Unread messages from clients
        unread_messages = PortalMessage.objects.filter(
            engagement_id__in=eng_ids,
            is_read=False,
        ).exclude(sender=request.user).select_related("client_profile", "sender").order_by("-created_at")[:20]

        return Response({
            "pending_docs": ClientDocumentSerializer(pending_docs, many=True, context={"request": request}).data,
            "open_actions": AccountantActionSerializer(open_actions, many=True).data,
            "recent_reminders": ReminderLogSerializer(recent_reminders, many=True).data,
            "unread_messages": PortalMessageSerializer(unread_messages, many=True, context={"request": request}).data,
            "counts": {
                "pending_docs":    pending_docs.count(),
                "open_actions":    open_actions.count(),
                "unread_messages": unread_messages.count(),
            },
        })


# ── P3.1 Portal Messaging ─────────────────────────────────────────────────────

class EngagementMessagesView(APIView):
    """
    GET  /api/portal/engagements/<pk>/messages/  — accountant fetches thread
    POST /api/portal/engagements/<pk>/messages/  — accountant sends message
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=404)
        msgs = PortalMessage.objects.filter(engagement=eng).order_by("created_at")
        # Mark all unread messages addressed to this user as read
        PortalMessage.objects.filter(
            engagement=eng, is_read=False
        ).exclude(sender=request.user).update(is_read=True, read_at=timezone.now())
        return Response(PortalMessageSerializer(msgs, many=True, context={"request": request}).data)

    def post(self, request, pk):
        eng = get_object_or_404(TaxEngagement, pk=pk)
        if not _can_access_engagement(request.user, eng):
            return Response({"detail": "Not found."}, status=404)
        body = request.data.get("body", "").strip()
        if not body:
            return Response({"detail": "body is required."}, status=400)
        msg = PortalMessage.objects.create(
            engagement=eng,
            client_profile=eng.client_profile,
            sender=request.user,
            body=body,
        )
        _audit(request, "message_sent", "PortalMessage", msg.id,
               client_profile=eng.client_profile, engagement=eng)

        # Notify the other party: if accountant sent → notify client; if client sent → notify accountant
        sender_name = request.user.get_full_name() or request.user.email
        body_preview = body[:120] + ("…" if len(body) > 120 else "")
        if request.user.role == "accountant":
            if eng.client_profile.client_user_id:
                lang = eng.client_profile.preferred_language or "nl"
                TITLES = {"nl": "Nieuw bericht van uw accountant", "en": "New message from your accountant", "fa": "پیام جدید از حسابدار شما"}
                create_notification(
                    user=eng.client_profile.client_user,
                    notif_type="message_received",
                    title=TITLES.get(lang, TITLES["en"]),
                    body=body_preview,
                    action_url="/client/messages",
                    metadata={"engagement_id": eng.id},
                )
        else:
            if eng.accountant_id:
                create_notification(
                    user=eng.accountant,
                    notif_type="message_received",
                    title=f"New message from {sender_name}",
                    body=body_preview,
                    action_url=f"/accountant/engagements/{eng.id}",
                    metadata={"engagement_id": eng.id},
                )

        return Response(
            PortalMessageSerializer(msg, context={"request": request}).data,
            status=201,
        )


class ClientMessageUnreadCountView(APIView):
    """GET /api/portal/client/messages/unread-count/ — lightweight badge count without marking as read."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = _get_or_create_self_service_profile(request.user)
        eng = _get_or_create_engagement(profile)
        if not eng:
            return Response({"count": 0})
        count = PortalMessage.objects.filter(
            engagement=eng, is_read=False
        ).exclude(sender=request.user).count()
        return Response({"count": count})


class ClientMessagesView(APIView):
    """
    GET  /api/portal/client/messages/  — client fetches their message thread
    POST /api/portal/client/messages/  — client sends a message to their accountant
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_engagement(self, user):
        profile = _get_or_create_self_service_profile(user)
        return _get_or_create_engagement(profile), profile

    def get(self, request):
        eng, profile = self._get_engagement(request.user)
        msgs = PortalMessage.objects.filter(engagement=eng).order_by("created_at")
        # Mark unread messages from accountant as read
        PortalMessage.objects.filter(
            engagement=eng, is_read=False
        ).exclude(sender=request.user).update(is_read=True, read_at=timezone.now())
        return Response(PortalMessageSerializer(msgs, many=True, context={"request": request}).data)

    def post(self, request):
        eng, profile = self._get_engagement(request.user)
        body = request.data.get("body", "").strip()
        if not body:
            return Response({"detail": "body is required."}, status=400)
        msg = PortalMessage.objects.create(
            engagement=eng,
            client_profile=profile,
            sender=request.user,
            body=body,
        )
        # Notify accountant of new client message
        if eng and eng.accountant_id:
            sender_name = request.user.get_full_name() or profile.first_name or request.user.email
            body_preview = body[:120] + ("…" if len(body) > 120 else "")
            create_notification(
                user=eng.accountant,
                notif_type="message_received",
                title=f"New message from {sender_name}",
                body=body_preview,
                action_url=f"/accountant/engagements/{eng.id}",
                metadata={"engagement_id": eng.id},
            )
        return Response(
            PortalMessageSerializer(msg, context={"request": request}).data,
            status=201,
        )


# ── Portal Invitation Send / Accept ──────────────────────────────────────────

import secrets as _secrets
import datetime as _dt


class PortalInvitationSendView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not _is_portal_user(request.user):
            return Response({"detail": "Accountant access required."}, status=403)
        from .models import Invitation
        email       = (request.data.get("email", "") or "").strip().lower()
        client_name = (request.data.get("client_name", "") or "").strip()
        client_type = request.data.get("client_type", "other")
        tax_year    = int(request.data.get("tax_year", 2026))
        lang        = request.data.get("preferred_language", "nl")
        if not email:
            return Response({"detail": "email is required."}, status=400)
        if Invitation.objects.filter(sent_by=request.user, client_email__iexact=email, status="pending").exists():
            return Response({"detail": "A pending invitation already exists for this email."}, status=400)
        message    = (request.data.get("message", "") or "").strip()
        token      = _secrets.token_urlsafe(48)
        expires_at = timezone.now() + _dt.timedelta(days=7)
        inv = Invitation.objects.create(
            sent_by=request.user, client_email=email, client_name=client_name,
            message=message, tax_year=tax_year, token=token,
            expires_at=expires_at, status="pending",
        )
        profile, _ = AccountantClientProfile.objects.get_or_create(
            accountant_user=request.user, email__iexact=email,
            defaults={"email": email, "first_name": client_name.split(" ")[0] if client_name else "",
                      "last_name": " ".join(client_name.split(" ")[1:]) if client_name else "",
                      "client_type": client_type, "preferred_language": lang,
                      "status": "invited", "tax_year": tax_year},
        )
        _audit(request, "portal_invitation_sent", "Invitation", inv.id, client_profile=profile)
        return Response({"id": inv.id, "token": token, "client_email": email,
                         "expires_at": inv.expires_at.isoformat(), "status": "pending",
                         "accept_url": f"/portal/accept-invitation?token={token}"}, status=201)


class PortalInvitationAcceptView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .models import Invitation
        from apps.portal.services.accountant_checklists import create_checklist_for_engagement
        token = (request.data.get("token", "") or "").strip()
        if not token:
            return Response({"detail": "token is required."}, status=400)
        try:
            inv = Invitation.objects.select_related("sent_by", "client_user").get(token=token)
        except Invitation.DoesNotExist:
            return Response({"detail": "Invalid or expired invitation."}, status=404)
        if inv.status != "pending":
            return Response({"detail": f"This invitation has already been {inv.status}."}, status=400)
        if inv.expires_at <= timezone.now():
            inv.status = "expired"; inv.save(update_fields=["status"])
            return Response({"detail": "This invitation has expired."}, status=400)
        inv.client_user = request.user; inv.status = "accepted"; inv.accepted_at = timezone.now()
        inv.save(update_fields=["client_user", "status", "accepted_at"])
        profile = AccountantClientProfile.objects.filter(accountant_user=inv.sent_by, email__iexact=inv.client_email).first()
        if not profile:
            profile = AccountantClientProfile.objects.create(
                accountant_user=inv.sent_by, client_user=request.user,
                email=request.user.email,
                first_name=getattr(request.user, "first_name", ""),
                last_name=getattr(request.user, "last_name", ""),
                status="active", tax_year=inv.tax_year,
            )
        else:
            profile.client_user = request.user; profile.status = "active"
            profile.save(update_fields=["client_user", "status", "updated_at"])
        try:
            from apps.users.models import AccountantProfile, AccountantClient
            acc_profile = AccountantProfile.objects.get(user=inv.sent_by)
            AccountantClient.objects.get_or_create(accountant=acc_profile, client_user=request.user, defaults={"status": "active"})
        except Exception:
            pass
        engagement = TaxEngagement.objects.filter(client_profile=profile).order_by("-created_at").first()
        if not engagement:
            engagement = TaxEngagement.objects.create(
                accountant=inv.sent_by, client_profile=profile,
                tax_year=inv.tax_year, status="collecting",
            )
            try:
                create_checklist_for_engagement(engagement)
            except Exception:
                pass
        inv.engagement = engagement; inv.save(update_fields=["engagement"])
        _audit(request, "portal_invitation_accepted", "Invitation", inv.id, client_profile=profile, engagement=engagement)
        return Response({"detail": "Invitation accepted. Your tax portal is ready.",
                         "profile_id": profile.id, "engagement_id": engagement.id, "redirect_to": "/client"})


class PortalInvitationListView(APIView):
    """
    GET /api/portal/invitations/sent/
    Returns all invitations sent by this accountant, newest first.
    Format is compatible with the frontend SentInvitation type.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_portal_user(request.user):
            return Response({"detail": "Accountant access required."}, status=403)
        from .models import Invitation
        invs = Invitation.objects.filter(sent_by=request.user).order_by("-created_at")
        return Response([
            {
                "id":            inv.id,
                "invited_email": inv.client_email,
                "client_name":   inv.client_name or None,
                "status":        inv.status,
                "message":       inv.message,
                "created_at":    inv.created_at.date().isoformat(),
                "expires_at":    inv.expires_at.isoformat() if inv.expires_at else None,
                "accept_url":    f"/portal/accept-invitation?token={inv.token}" if inv.status == "pending" else None,
            }
            for inv in invs
        ])


class PortalInvitationCancelView(APIView):
    """
    DELETE /api/portal/invitations/<pk>/cancel/
    Cancels a pending invitation sent by this accountant.
    """
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk=None):
        if not _is_portal_user(request.user):
            return Response({"detail": "Accountant access required."}, status=403)
        from .models import Invitation
        updated = Invitation.objects.filter(pk=pk, sent_by=request.user, status="pending").update(status="cancelled")
        if not updated:
            return Response({"detail": "Invitation not found or already closed."}, status=404)
        return Response(status=204)
