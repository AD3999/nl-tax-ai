"""
Phase 7 — Portal app tests.

Covers:
  - PortalReminderView: reminder creates ReminderLog + PortalMessage
  - AccountantInvitationsView: send, list
  - ClientInvitationsView: accept, decline
  - EngagementMessagesView: read messages thread
  - PushSubscribeView / PushVapidKeyView (users app endpoints used by portal flow)

All tests run fully offline — no Anthropic API, no push delivery.
"""
from unittest import mock

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User, AccountantProfile, AccountantInvitation
from apps.portal.models import (
    Firm, AccountantClientProfile, TaxEngagement,
    DocumentRequest, ReminderLog, PortalMessage,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_user(email, role="client", **kw):
    u = User.objects.create_user(username=email, email=email, password="testpass123", role=role, **kw)
    return u


def _jwt(user):
    return str(RefreshToken.for_user(user).access_token)


def _auth(user):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {_jwt(user)}")
    return c


def _make_accountant_setup():
    """Create accountant user + profile + firm + client profile + engagement."""
    acc_user = _make_user("accountant@test.com", role="accountant")
    acc_profile = AccountantProfile.objects.create(user=acc_user, firm_name="Test Firm")
    firm = Firm.objects.create(name="Test Firm", owner=acc_user)

    client_user = _make_user("client@test.com", role="client")
    profile = AccountantClientProfile.objects.create(
        accountant_user=acc_user,
        nickname="Test Client",
        email="client@test.com",
        client_user=client_user,
        firm=firm,
        tax_year=2026,
    )
    engagement = TaxEngagement.objects.create(
        client_profile=profile,
        accountant=acc_profile,
        firm=firm,
        tax_year=2026,
        status="active",
    )
    return acc_user, acc_profile, firm, client_user, profile, engagement


# ── Reminder tests ────────────────────────────────────────────────────────────

class PortalReminderTests(TestCase):
    def setUp(self):
        (self.acc_user, self.acc_profile, self.firm,
         self.client_user, self.profile, self.eng) = _make_accountant_setup()
        self.client = _auth(self.acc_user)

    def _post_reminder(self, lang="en"):
        # Patch push so we don't need VAPID keys in tests
        with mock.patch("apps.portal.views.send_push_notification") as mock_push:
            resp = self.client.post(
                f"/api/portal/engagements/{self.eng.pk}/send-reminder/",
                {"lang": lang},
                format="json",
            )
            return resp, mock_push

    def test_reminder_returns_200(self):
        resp, _ = self._post_reminder()
        self.assertEqual(resp.status_code, 200)

    def test_reminder_sent_flag_is_true(self):
        resp, _ = self._post_reminder()
        data = resp.json()
        self.assertTrue(data.get("sent"))
        self.assertFalse(data.get("preview"))

    def test_reminder_creates_reminder_log(self):
        self._post_reminder()
        self.assertTrue(ReminderLog.objects.filter(engagement=self.eng).exists())

    def test_reminder_log_delivered_true(self):
        self._post_reminder()
        log = ReminderLog.objects.filter(engagement=self.eng).first()
        self.assertTrue(log.delivered)

    def test_reminder_creates_portal_message(self):
        self._post_reminder()
        self.assertTrue(PortalMessage.objects.filter(engagement=self.eng).exists())

    def test_reminder_nl_lang(self):
        resp, _ = self._post_reminder(lang="nl")
        self.assertEqual(resp.status_code, 200)

    def test_reminder_fa_lang(self):
        resp, _ = self._post_reminder(lang="fa")
        self.assertEqual(resp.status_code, 200)

    def test_reminder_calls_push_when_client_user_exists(self):
        resp, mock_push = self._post_reminder()
        self.assertEqual(resp.status_code, 200)
        mock_push.assert_called_once()

    def test_reminder_skip_push_when_no_client_user(self):
        # Profile without a linked TaxWijs account
        self.profile.client_user = None
        self.profile.save()
        resp, mock_push = self._post_reminder()
        self.assertEqual(resp.status_code, 200)
        mock_push.assert_not_called()

    def test_reminder_unauthenticated_returns_401(self):
        c = APIClient()
        resp = c.post(f"/api/portal/engagements/{self.eng.pk}/send-reminder/", {"lang": "en"}, format="json")
        self.assertIn(resp.status_code, (401, 403))


# ── Invitation tests ──────────────────────────────────────────────────────────

class AccountantInvitationTests(TestCase):
    def setUp(self):
        (self.acc_user, self.acc_profile, self.firm,
         self.client_user, self.profile, self.eng) = _make_accountant_setup()
        self.acc_client = _auth(self.acc_user)
        self.cli_client = _auth(self.client_user)

    def _send_invitation(self, email="newclient@test.com"):
        return self.acc_client.post(
            "/api/users/accountant/invitations/",
            {"invited_email": email, "message": "Please join TaxWijs"},
            format="json",
        )

    def test_accountant_can_send_invitation(self):
        resp = self._send_invitation()
        self.assertIn(resp.status_code, (200, 201))

    def test_invitation_object_created(self):
        self._send_invitation("new2@test.com")
        self.assertTrue(AccountantInvitation.objects.filter(invited_email="new2@test.com").exists())

    def test_invitation_status_is_pending(self):
        self._send_invitation("new3@test.com")
        inv = AccountantInvitation.objects.get(invited_email="new3@test.com")
        self.assertEqual(inv.status, "pending")

    def test_client_can_list_invitations(self):
        # Create invitation addressed to client_user's email
        AccountantInvitation.objects.create(
            accountant=self.acc_profile,
            invited_email=self.client_user.email,
            client_user=self.client_user,
            status="pending",
        )
        resp = self.cli_client.get("/api/users/client/invitations/")
        self.assertEqual(resp.status_code, 200)

    def test_client_can_accept_invitation(self):
        inv = AccountantInvitation.objects.create(
            accountant=self.acc_profile,
            invited_email=self.client_user.email,
            client_user=self.client_user,
            status="pending",
        )
        with mock.patch("apps.users.views.send_push_notification"):
            resp = self.cli_client.post(
                f"/api/users/client/invitations/{inv.pk}/respond/",
                {"action": "accept"},
                format="json",
            )
        self.assertEqual(resp.status_code, 200)
        inv.refresh_from_db()
        self.assertEqual(inv.status, "accepted")

    def test_client_can_decline_invitation(self):
        inv = AccountantInvitation.objects.create(
            accountant=self.acc_profile,
            invited_email=self.client_user.email,
            client_user=self.client_user,
            status="pending",
        )
        with mock.patch("apps.users.views.send_push_notification"):
            resp = self.cli_client.post(
                f"/api/users/client/invitations/{inv.pk}/respond/",
                {"action": "decline"},
                format="json",
            )
        self.assertEqual(resp.status_code, 200)
        inv.refresh_from_db()
        self.assertEqual(inv.status, "declined")

    def test_duplicate_pending_invitation_rejected(self):
        self._send_invitation("dup@test.com")
        resp2 = self._send_invitation("dup@test.com")
        # Second attempt should return 400 (duplicate constraint)
        self.assertIn(resp2.status_code, (400, 409))


# ── Messages thread tests ─────────────────────────────────────────────────────

class EngagementMessagesTests(TestCase):
    def setUp(self):
        (self.acc_user, self.acc_profile, self.firm,
         self.client_user, self.profile, self.eng) = _make_accountant_setup()
        self.acc_client = _auth(self.acc_user)
        self.cli_client = _auth(self.client_user)

    def test_accountant_can_read_messages(self):
        resp = self.acc_client.get(f"/api/portal/engagements/{self.eng.pk}/messages/")
        self.assertEqual(resp.status_code, 200)

    def test_reminder_message_appears_in_thread(self):
        with mock.patch("apps.portal.views.send_push_notification"):
            self.acc_client.post(
                f"/api/portal/engagements/{self.eng.pk}/send-reminder/",
                {"lang": "en"},
                format="json",
            )
        resp = self.acc_client.get(f"/api/portal/engagements/{self.eng.pk}/messages/")
        self.assertEqual(resp.status_code, 200)
        msgs = resp.json()
        body = msgs if isinstance(msgs, list) else msgs.get("results", [])
        self.assertGreater(len(body), 0)
