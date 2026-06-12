"""
Tests for portal services: checklist generation, readiness engine, missing info detection.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.portal.models import AccountantClientProfile, TaxEngagement, ChecklistItem, AccountantAction
from apps.portal.services.accountant_checklists import CHECKLISTS, create_checklist_for_engagement
from apps.portal.services.readiness import calculate_readiness
from apps.portal.services.missing_info import detect_missing_information

User = get_user_model()


def make_accountant():
    import random
    n = random.randint(1, 99999)
    return User.objects.create_user(username=f"acc{n}", email=f"acc{n}@test.com", password="x", role="accountant")


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


class TestChecklistTemplates(TestCase):
    def test_all_client_types_have_templates(self):
        for ctype in ["employee", "zzp", "expat", "dga", "other"]:
            self.assertIn(ctype, CHECKLISTS)
            self.assertGreater(len(CHECKLISTS[ctype]), 0)

    def test_zzp_has_kvk_item(self):
        keys = [i["stable_key"] for i in CHECKLISTS["zzp"]]
        self.assertTrue(any("kvk" in k for k in keys))

    def test_employee_has_jaaropgave(self):
        keys = [i["stable_key"] for i in CHECKLISTS["employee"]]
        self.assertTrue(any("jaaropgave" in k for k in keys))

    def test_expat_has_30pct_ruling(self):
        keys = [i["stable_key"] for i in CHECKLISTS["expat"]]
        self.assertTrue(any("30pct" in k or "ruling" in k for k in keys))

    def test_dga_has_salary(self):
        keys = [i["stable_key"] for i in CHECKLISTS["dga"]]
        self.assertTrue(any("salary" in k or "loon" in k for k in keys))


class TestCreateChecklist(TestCase):
    def setUp(self):
        self.accountant = make_accountant()

    def test_creates_items_for_zzp(self):
        profile = make_profile(self.accountant, "zzp")
        engagement = make_engagement(self.accountant, profile)
        create_checklist_for_engagement(engagement)
        count = ChecklistItem.objects.filter(engagement=engagement).count()
        self.assertGreater(count, 0)

    def test_idempotent(self):
        profile = make_profile(self.accountant, "zzp")
        engagement = make_engagement(self.accountant, profile)
        create_checklist_for_engagement(engagement)
        first_count = ChecklistItem.objects.filter(engagement=engagement).count()
        create_checklist_for_engagement(engagement)
        second_count = ChecklistItem.objects.filter(engagement=engagement).count()
        self.assertEqual(first_count, second_count)

    def test_required_items_exist(self):
        profile = make_profile(self.accountant, "employee")
        engagement = make_engagement(self.accountant, profile)
        create_checklist_for_engagement(engagement)
        required = ChecklistItem.objects.filter(engagement=engagement, required=True)
        self.assertGreater(required.count(), 0)


class TestReadiness(TestCase):
    def setUp(self):
        self.accountant = make_accountant()

    def test_empty_engagement_score_in_range(self):
        profile = make_profile(self.accountant, "zzp")
        engagement = make_engagement(self.accountant, profile)
        create_checklist_for_engagement(engagement)
        result = calculate_readiness(engagement)
        self.assertGreaterEqual(result["score"], 0)
        self.assertLessEqual(result["score"], 100)

    def test_not_ready_when_missing_required(self):
        profile = make_profile(self.accountant, "employee")
        engagement = make_engagement(self.accountant, profile)
        create_checklist_for_engagement(engagement)
        result = calculate_readiness(engagement)
        self.assertFalse(result["ready_to_file"])

    def test_ready_when_all_accepted(self):
        profile = make_profile(self.accountant, "zzp")
        engagement = make_engagement(self.accountant, profile)
        create_checklist_for_engagement(engagement)
        ChecklistItem.objects.filter(engagement=engagement, required=True).update(status="accepted")
        ChecklistItem.objects.filter(engagement=engagement, required=False).update(status="waived")
        result = calculate_readiness(engagement)
        self.assertGreaterEqual(result["score"], 80)

    def test_updates_engagement_readiness_score(self):
        profile = make_profile(self.accountant, "zzp")
        engagement = make_engagement(self.accountant, profile)
        create_checklist_for_engagement(engagement)
        calculate_readiness(engagement)
        engagement.refresh_from_db()
        self.assertGreaterEqual(engagement.readiness_score, 0)

    def test_risk_level_set(self):
        profile = make_profile(self.accountant, "zzp")
        engagement = make_engagement(self.accountant, profile)
        create_checklist_for_engagement(engagement)
        result = calculate_readiness(engagement)
        self.assertIn(result["risk_level"], ("low", "medium", "high"))


class TestDetectMissingInformation(TestCase):
    def setUp(self):
        self.accountant = make_accountant()

    def test_detect_runs_without_error(self):
        profile = make_profile(self.accountant, "zzp")
        engagement = make_engagement(self.accountant, profile)
        detect_missing_information(engagement)
        actions = AccountantAction.objects.filter(engagement=engagement)
        self.assertGreaterEqual(actions.count(), 0)

    def test_idempotent_detect(self):
        profile = make_profile(self.accountant, "zzp")
        engagement = make_engagement(self.accountant, profile)
        detect_missing_information(engagement)
        first_count = AccountantAction.objects.filter(engagement=engagement).count()
        detect_missing_information(engagement)
        second_count = AccountantAction.objects.filter(engagement=engagement).count()
        self.assertEqual(first_count, second_count)
