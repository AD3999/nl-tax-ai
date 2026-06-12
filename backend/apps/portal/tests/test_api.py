"""
Tests for portal API endpoints: authentication, object-level permissions, CRUD.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.portal.models import AccountantClientProfile, TaxEngagement, ChecklistItem

User = get_user_model()


def auth_header(api_client, user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")


class PortalAPITestBase(TestCase):
    def setUp(self):
        self.api = APIClient()
        self.accountant = User.objects.create_user(username="acc", email="acc@test.com", password="pass123", role="accountant")
        self.other_accountant = User.objects.create_user(username="other", email="other@test.com", password="pass123", role="accountant")
        self.regular_user = User.objects.create_user(username="regularuser", email="user@test.com", password="pass123")
        self.profile = AccountantClientProfile.objects.create(
            accountant_user=self.accountant,
            email="client@example.com",
            first_name="Jan",
            last_name="Janssen",
            client_type="zzp",
            tax_year=2026,
        )
        self.engagement = TaxEngagement.objects.create(
            accountant=self.accountant,
            client_profile=self.profile,
            tax_year=2026,
            engagement_type="income_tax",
        )


class TestClientListEndpoint(PortalAPITestBase):
    def test_requires_auth(self):
        r = self.api.get("/api/portal/clients/")
        self.assertEqual(r.status_code, 401)

    def test_accountant_sees_own_clients(self):
        auth_header(self.api, self.accountant)
        r = self.api.get("/api/portal/clients/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(any(c["id"] == self.profile.id for c in r.data))

    def test_other_accountant_cannot_see_clients(self):
        auth_header(self.api, self.other_accountant)
        r = self.api.get("/api/portal/clients/")
        self.assertEqual(r.status_code, 200)
        self.assertFalse(any(c["id"] == self.profile.id for c in r.data))

    def test_create_client(self):
        auth_header(self.api, self.accountant)
        r = self.api.post("/api/portal/clients/", {
            "email": "new@client.com",
            "first_name": "New",
            "client_type": "employee",
            "tax_year": 2026,
        }, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["email"], "new@client.com")


class TestEngagementEndpoint(PortalAPITestBase):
    def test_create_engagement_generates_checklist(self):
        auth_header(self.api, self.accountant)
        r = self.api.post("/api/portal/engagements/", {
            "client_profile": self.profile.id,
            "tax_year": 2026,
            "engagement_type": "income_tax",
        }, format="json")
        self.assertEqual(r.status_code, 201)
        eng_id = r.data["id"]
        count = ChecklistItem.objects.filter(engagement_id=eng_id).count()
        self.assertGreater(count, 0)

    def test_cannot_access_other_accountants_engagement(self):
        auth_header(self.api, self.other_accountant)
        r = self.api.get(f"/api/portal/engagements/{self.engagement.id}/")
        self.assertIn(r.status_code, (403, 404))


class TestReadinessEndpoint(PortalAPITestBase):
    def test_recalculate_returns_readiness(self):
        auth_header(self.api, self.accountant)
        r = self.api.post(f"/api/portal/engagements/{self.engagement.id}/recalculate-readiness/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("score", r.data)
        self.assertIn("ready_to_file", r.data)
        self.assertGreaterEqual(r.data["score"], 0)
        self.assertLessEqual(r.data["score"], 100)


class TestChecklistEndpoint(PortalAPITestBase):
    def test_get_checklist(self):
        auth_header(self.api, self.accountant)
        r = self.api.get(f"/api/portal/engagements/{self.engagement.id}/checklist/")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.data, list)

    def test_update_checklist_item(self):
        auth_header(self.api, self.accountant)
        item = ChecklistItem.objects.create(
            engagement=self.engagement,
            client_profile=self.engagement.client_profile,
            title="Test item",
            stable_key="test-item",
        )
        r = self.api.patch(f"/api/portal/checklist/{item.id}/", {"status": "accepted"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["status"], "accepted")


class TestRisksEndpoint(PortalAPITestBase):
    def test_risks_returns_opportunities_and_risks(self):
        auth_header(self.api, self.accountant)
        r = self.api.get(f"/api/portal/engagements/{self.engagement.id}/risks/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("opportunities", r.data)
        self.assertIn("risks", r.data)
        self.assertIsInstance(r.data["opportunities"], list)
        self.assertIsInstance(r.data["risks"], list)


class TestAuditEndpoint(PortalAPITestBase):
    def test_audit_log_accessible(self):
        auth_header(self.api, self.accountant)
        r = self.api.get(f"/api/portal/engagements/{self.engagement.id}/audit/")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.data, list)


class TestDocumentUploadEndpoint(PortalAPITestBase):
    def test_upload_requires_auth(self):
        r = self.api.post("/api/portal/documents/upload/")
        self.assertEqual(r.status_code, 401)

    def test_upload_rejects_bad_mime(self):
        import io
        from django.core.files.uploadedfile import InMemoryUploadedFile
        auth_header(self.api, self.accountant)
        fake_file = io.BytesIO(b"<script>alert(1)</script>")
        fake_file.name = "evil.html"
        uploaded = InMemoryUploadedFile(
            fake_file, "file", "evil.html", "text/html", len(b"<script>"), None
        )
        r = self.api.post("/api/portal/documents/upload/", {
            "engagement": self.engagement.id,
            "client_profile": self.engagement.client_profile.id,
            "file": uploaded,
        }, format="multipart")
        self.assertEqual(r.status_code, 400)
