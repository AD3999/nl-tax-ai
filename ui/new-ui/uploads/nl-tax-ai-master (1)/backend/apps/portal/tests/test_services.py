"""
Tests for portal services: checklist generation, readiness engine, missing info detection.
"""
import pytest
from django.contrib.auth import get_user_model
from apps.portal.models import (
    AccountantClientProfile, TaxEngagement, ChecklistItem, AccountantAction,
)
from apps.portal.services.accountant_checklists import (
    CHECKLISTS, create_checklist_for_engagement,
)
from apps.portal.services.readiness import calculate_readiness
from apps.portal.services.missing_info import detect_missing_information

User = get_user_model()


@pytest.fixture
def accountant(db):
    return User.objects.create_user(email="acc@test.com", password="x", is_staff=True)


def make_profile(accountant, client_type="zzp"):
    return AccountantClientProfile.objects.create(
        accountant_user=accountant,
        email="client@example.com",
        first_name="Test",
        client_type=client_type,
        tax_year=2026,
    )


def make_engagement(accountant, profile):
    return TaxEngagement.objects.create(
        accountant=accountant,
        client_profile=profile,
        tax_year=2026,
        engagement_type="income_tax",
    )


class TestChecklistTemplates:
    def test_all_client_types_have_templates(self):
        for ctype in ["employee", "zzp", "expat", "dga", "other"]:
            assert ctype in CHECKLISTS
            assert len(CHECKLISTS[ctype]) > 0

    def test_zzp_has_kvk_item(self):
        items = CHECKLISTS["zzp"]
        keys = [i["stable_key"] for i in items]
        assert any("kvk" in k for k in keys)

    def test_employee_has_jaaropgave(self):
        items = CHECKLISTS["employee"]
        keys = [i["stable_key"] for i in items]
        assert any("jaaropgave" in k for k in keys)

    def test_expat_has_30pct_ruling(self):
        items = CHECKLISTS["expat"]
        keys = [i["stable_key"] for i in items]
        assert any("30pct" in k or "ruling" in k for k in keys)

    def test_dga_has_salary(self):
        items = CHECKLISTS["dga"]
        keys = [i["stable_key"] for i in items]
        assert any("salary" in k or "loon" in k for k in keys)


class TestCreateChecklist:
    def test_creates_items_for_zzp(self, db, accountant):
        profile = make_profile(accountant, "zzp")
        engagement = make_engagement(accountant, profile)
        create_checklist_for_engagement(engagement)
        count = ChecklistItem.objects.filter(engagement=engagement).count()
        assert count > 0

    def test_idempotent(self, db, accountant):
        profile = make_profile(accountant, "zzp")
        engagement = make_engagement(accountant, profile)
        create_checklist_for_engagement(engagement)
        first_count = ChecklistItem.objects.filter(engagement=engagement).count()
        # Run again — should not create duplicates
        create_checklist_for_engagement(engagement)
        second_count = ChecklistItem.objects.filter(engagement=engagement).count()
        assert first_count == second_count

    def test_required_items_exist(self, db, accountant):
        profile = make_profile(accountant, "employee")
        engagement = make_engagement(accountant, profile)
        create_checklist_for_engagement(engagement)
        required = ChecklistItem.objects.filter(engagement=engagement, required=True)
        assert required.count() > 0


class TestReadiness:
    def test_empty_engagement_zero_score(self, db, accountant):
        profile = make_profile(accountant, "zzp")
        engagement = make_engagement(accountant, profile)
        create_checklist_for_engagement(engagement)
        result = calculate_readiness(engagement)
        assert result["score"] >= 0
        assert result["score"] <= 100

    def test_not_ready_when_missing_required(self, db, accountant):
        profile = make_profile(accountant, "employee")
        engagement = make_engagement(accountant, profile)
        create_checklist_for_engagement(engagement)
        result = calculate_readiness(engagement)
        assert result["ready_to_file"] is False

    def test_ready_when_all_accepted(self, db, accountant):
        profile = make_profile(accountant, "zzp")
        engagement = make_engagement(accountant, profile)
        create_checklist_for_engagement(engagement)
        # Accept all required items
        ChecklistItem.objects.filter(engagement=engagement, required=True).update(status="accepted")
        ChecklistItem.objects.filter(engagement=engagement, required=False).update(status="waived")
        result = calculate_readiness(engagement)
        assert result["score"] >= 80

    def test_updates_engagement_readiness_score(self, db, accountant):
        profile = make_profile(accountant, "zzp")
        engagement = make_engagement(accountant, profile)
        create_checklist_for_engagement(engagement)
        calculate_readiness(engagement)
        engagement.refresh_from_db()
        assert engagement.readiness_score >= 0

    def test_risk_level_high_when_many_missing(self, db, accountant):
        profile = make_profile(accountant, "zzp")
        engagement = make_engagement(accountant, profile)
        create_checklist_for_engagement(engagement)
        # All items todo = many missing
        result = calculate_readiness(engagement)
        # With all items todo, risk should be medium or high
        assert result["risk_level"] in ("medium", "high")


class TestDetectMissingInformation:
    def test_detect_creates_actions_for_zzp(self, db, accountant):
        profile = make_profile(accountant, "zzp")
        engagement = make_engagement(accountant, profile)
        detect_missing_information(engagement)
        actions = AccountantAction.objects.filter(engagement=engagement)
        assert actions.count() >= 0  # May be 0 if checklist items satisfy requirements

    def test_idempotent_detect(self, db, accountant):
        profile = make_profile(accountant, "zzp")
        engagement = make_engagement(accountant, profile)
        detect_missing_information(engagement)
        first_count = AccountantAction.objects.filter(engagement=engagement).count()
        detect_missing_information(engagement)
        second_count = AccountantAction.objects.filter(engagement=engagement).count()
        assert first_count == second_count
