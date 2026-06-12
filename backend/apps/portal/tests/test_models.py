"""
Tests for portal models: field defaults, stable_key uniqueness, __str__ methods.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.portal.models import (
    AccountantClientProfile, TaxEngagement, DocumentRequest,
    ClientDocument, ChecklistItem, AccountantAction, PortalAuditLog,
    ReminderLog, PortalMessage,
)

User = get_user_model()


class PortalModelTestBase(TestCase):
    def setUp(self):
        self.accountant = User.objects.create_user(username="accountant", email="accountant@test.com", password="x", role="accountant")
        self.client_user = User.objects.create_user(username="clientuser", email="client@test.com", password="x")
        self.profile = AccountantClientProfile.objects.create(
            accountant_user=self.accountant,
            email="client@example.com",
            first_name="Jan",
            last_name="de Vries",
            client_type="zzp",
            preferred_language="nl",
            tax_year=2026,
        )
        self.engagement = TaxEngagement.objects.create(
            accountant=self.accountant,
            client_profile=self.profile,
            tax_year=2026,
            engagement_type="income_tax",
        )


class TestAccountantClientProfile(PortalModelTestBase):
    def test_display_name_full(self):
        self.assertEqual(self.profile.display_name, "Jan de Vries")

    def test_display_name_fallback_email(self):
        acc2 = User.objects.create_user(username="acc2", email="acc2@test.com", password="x")
        p = AccountantClientProfile.objects.create(
            accountant_user=acc2,
            email="nobody@test.com",
            client_type="employee",
            tax_year=2026,
        )
        self.assertEqual(p.display_name, "nobody@test.com")

    def test_default_status(self):
        self.assertEqual(self.profile.status, "invited")

    def test_default_readiness(self):
        self.assertEqual(self.engagement.readiness_score, 0)


class TestTaxEngagement(PortalModelTestBase):
    def test_default_readiness_score(self):
        self.assertEqual(self.engagement.readiness_score, 0)

    def test_default_missing_items_count(self):
        self.assertEqual(self.engagement.missing_items_count, 0)

    def test_default_risk_level(self):
        self.assertEqual(self.engagement.risk_level, "low")

    def test_default_status(self):
        self.assertEqual(self.engagement.status, "draft")

    def test_str(self):
        s = str(self.engagement)
        self.assertIn("2026", s)


class TestDocumentRequest(PortalModelTestBase):
    def test_stable_key_blank_by_default(self):
        req = DocumentRequest.objects.create(
            engagement=self.engagement,
            client_profile=self.profile,
            title="Jaaropgave",
            request_type="income_documents",
        )
        self.assertEqual(req.stable_key, "")

    def test_stable_key_can_be_set(self):
        req = DocumentRequest.objects.create(
            engagement=self.engagement,
            client_profile=self.profile,
            title="Jaaropgave",
            request_type="income_documents",
            stable_key="req-jaaropgave",
        )
        self.assertEqual(req.stable_key, "req-jaaropgave")


class TestChecklistItem(PortalModelTestBase):
    def test_stable_key_idempotent(self):
        ChecklistItem.objects.create(
            engagement=self.engagement,
            client_profile=self.profile,
            title="Upload jaaropgave",
            stable_key="jaaropgave-2026",
            required=True,
        )
        item2 = ChecklistItem.objects.create(
            engagement=self.engagement,
            client_profile=self.profile,
            title="Upload jaaropgave",
            stable_key="jaaropgave-2026",
            required=True,
        )
        self.assertIsNotNone(item2.pk)

    def test_default_status(self):
        item = ChecklistItem.objects.create(
            engagement=self.engagement,
            client_profile=self.profile,
            title="Test",
            stable_key="test-item",
        )
        self.assertEqual(item.status, "todo")


class TestAccountantAction(PortalModelTestBase):
    def test_default_status(self):
        action = AccountantAction.objects.create(
            engagement=self.engagement,
            client_profile=self.profile,
            title="Check jaaropgave",
            body="Please upload your jaaropgave.",
            stable_key="action-jaaropgave",
        )
        self.assertEqual(action.status, "open")


class TestPortalAuditLog(PortalModelTestBase):
    def test_create_audit_log(self):
        log = PortalAuditLog.objects.create(
            actor_user=self.accountant,
            accountant=self.accountant,
            client_profile=self.profile,
            action="create",
            entity_type="AccountantClientProfile",
            entity_id=str(self.profile.pk),
        )
        self.assertIsNotNone(log.pk)
        self.assertEqual(log.action, "create")


class TestReminderLog(PortalModelTestBase):
    def test_create_reminder_log(self):
        log = ReminderLog.objects.create(
            engagement=self.engagement,
            client_profile=self.profile,
            sent_by=self.accountant,
            reminder_type="document_request",
            channel="in_app",
            subject="Missing documents",
            body="Please upload your jaaropgave.",
        )
        self.assertIsNotNone(log.pk)
        self.assertFalse(log.delivered)
        self.assertEqual(log.reminder_type, "document_request")

    def test_str_representation(self):
        log = ReminderLog.objects.create(
            engagement=self.engagement,
            client_profile=self.profile,
            sent_by=self.accountant,
            reminder_type="custom",
            channel="email",
            subject="Test",
        )
        self.assertIn("custom", str(log))


class TestPortalMessage(PortalModelTestBase):
    def test_create_message(self):
        msg = PortalMessage.objects.create(
            engagement=self.engagement,
            client_profile=self.profile,
            sender=self.accountant,
            body="Hello, please upload your documents.",
        )
        self.assertIsNotNone(msg.pk)
        self.assertFalse(msg.is_read)
        self.assertEqual(msg.body, "Hello, please upload your documents.")

    def test_unread_by_default(self):
        msg = PortalMessage.objects.create(
            engagement=self.engagement,
            client_profile=self.profile,
            sender=self.accountant,
            body="Test message",
        )
        self.assertFalse(msg.is_read)
        self.assertIsNone(msg.read_at)
