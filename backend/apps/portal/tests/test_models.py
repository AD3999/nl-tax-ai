"""
Tests for portal models: field defaults, stable_key uniqueness, __str__ methods.
"""
import pytest
from django.contrib.auth import get_user_model
from apps.portal.models import (
    AccountantClientProfile, TaxEngagement, DocumentRequest,
    ClientDocument, ChecklistItem, AccountantAction, PortalAuditLog,
)

User = get_user_model()


@pytest.fixture
def accountant(db):
    return User.objects.create_user(email="accountant@test.com", password="x", is_staff=True)


@pytest.fixture
def client_user(db):
    return User.objects.create_user(email="client@test.com", password="x")


@pytest.fixture
def profile(db, accountant):
    return AccountantClientProfile.objects.create(
        accountant_user=accountant,
        email="client@example.com",
        first_name="Jan",
        last_name="de Vries",
        client_type="zzp",
        preferred_language="nl",
        tax_year=2026,
    )


@pytest.fixture
def engagement(db, accountant, profile):
    return TaxEngagement.objects.create(
        accountant=accountant,
        client_profile=profile,
        tax_year=2026,
        engagement_type="income_tax",
    )


class TestAccountantClientProfile:
    def test_display_name_full(self, profile):
        assert profile.display_name == "Jan de Vries"

    def test_display_name_fallback_email(self, db, accountant):
        p = AccountantClientProfile.objects.create(
            accountant_user=accountant,
            email="nobody@test.com",
            client_type="employee",
            tax_year=2026,
        )
        assert p.display_name == "nobody@test.com"

    def test_default_status(self, profile):
        assert profile.status == "invited"

    def test_default_readiness(self, profile):
        assert profile.readiness_score == 0


class TestTaxEngagement:
    def test_default_readiness_score(self, engagement):
        assert engagement.readiness_score == 0

    def test_default_missing_items_count(self, engagement):
        assert engagement.missing_items_count == 0

    def test_default_risk_level(self, engagement):
        assert engagement.risk_level == "low"

    def test_default_status(self, engagement):
        assert engagement.status == "draft"

    def test_str(self, engagement, profile):
        s = str(engagement)
        assert "2026" in s
        assert profile.email in s or "de Vries" in s


class TestDocumentRequest:
    def test_stable_key_blank_by_default(self, db, engagement, profile):
        req = DocumentRequest.objects.create(
            engagement=engagement,
            client_profile=profile,
            title="Jaaropgave",
            request_type="income_documents",
        )
        assert req.stable_key == ""

    def test_stable_key_can_be_set(self, db, engagement, profile):
        req = DocumentRequest.objects.create(
            engagement=engagement,
            client_profile=profile,
            title="Jaaropgave",
            request_type="income_documents",
            stable_key="req-jaaropgave",
        )
        assert req.stable_key == "req-jaaropgave"


class TestChecklistItem:
    def test_stable_key_idempotent(self, db, engagement, profile):
        ChecklistItem.objects.create(
            engagement=engagement,
            client_profile=profile,
            title="Upload jaaropgave",
            stable_key="jaaropgave-2026",
            required=True,
        )
        # Second create with same stable_key should not raise IntegrityError
        # (stable_key is not unique at DB level — idempotency is handled in service)
        item2 = ChecklistItem.objects.create(
            engagement=engagement,
            client_profile=profile,
            title="Upload jaaropgave",
            stable_key="jaaropgave-2026",
            required=True,
        )
        assert item2.pk is not None

    def test_default_status(self, db, engagement, profile):
        item = ChecklistItem.objects.create(
            engagement=engagement,
            client_profile=profile,
            title="Test",
            stable_key="test-item",
        )
        assert item.status == "todo"


class TestAccountantAction:
    def test_default_status(self, db, engagement, profile):
        action = AccountantAction.objects.create(
            engagement=engagement,
            client_profile=profile,
            title="Check jaaropgave",
            body="Please upload your jaaropgave.",
            stable_key="action-jaaropgave",
        )
        assert action.status == "open"


class TestPortalAuditLog:
    def test_create_audit_log(self, db, accountant, profile):
        log = PortalAuditLog.objects.create(
            actor_user=accountant,
            accountant=accountant,
            client_profile=profile,
            action="create",
            entity_type="AccountantClientProfile",
            entity_id=str(profile.pk),
        )
        assert log.pk is not None
        assert log.action == "create"
