"""Shared service for portal invitation business logic."""
import logging

logger = logging.getLogger(__name__)


def decline_portal_invitation(inv) -> None:
    """
    Mark a portal Invitation as declined, clean up the shell profile,
    and notify the accountant.  Call this from ANY endpoint that declines
    a portal-type invitation so the logic stays in one place.
    """
    from apps.portal.models import AccountantClientProfile, TaxEngagement
    from apps.users.notification_utils import create_notification

    inv.status = "declined"
    inv.save(update_fields=["status"])

    # Remove the pre-created shell profile so the accountant no longer sees
    # this person as "Invited" after they explicitly declined.
    try:
        shell_profile = AccountantClientProfile.objects.filter(
            accountant_user=inv.sent_by,
            email__iexact=inv.client_email,
            client_user__isnull=True,
        ).first()
        if shell_profile:
            has_engagement = TaxEngagement.objects.filter(client_profile=shell_profile).exists()
            if has_engagement:
                shell_profile.status = "archived"
                shell_profile.save(update_fields=["status", "updated_at"])
            else:
                shell_profile.delete()
    except Exception:
        logger.exception("Failed to clean up shell profile on invitation decline (inv=%s)", inv.id)

    # Notify the accountant in-app
    try:
        display_name = inv.client_name or inv.client_email
        create_notification(
            user       = inv.sent_by,
            notif_type = "invitation_declined",
            title      = f"{display_name} declined your invitation",
            body       = f"{display_name} has declined your TaxWijs portal invitation.",
            action_url = "/accountant/portal",
            metadata   = {"invitation_id": inv.id},
        )
    except Exception:
        logger.warning("Failed to send invitation_declined notification for inv %s", inv.id)
