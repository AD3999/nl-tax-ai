"""
Tests for portal API endpoints: authentication, object-level permissions, CRUD.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.portal.models import AccountantClientProfile, TaxEngagement, ChecklistItem

User = get_user_model()


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def accountant(db):
    user = User.objects.create_user(email="acc@test.com", password="pass123", is_staff=True)
    return user


@pytest.fixture
def other_accountant(db):
    return User.objects.create_user(email="other@test.com", password="pass123", is_staff=True)


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(email="user@test.com", password="pass123")


@pytest.fixture
def profile(db, accountant):
    return AccountantClientProfile.objects.create(
        accountant_user=accountant,
        email="client@example.com",
        first_name="Jan",
        last_name="Janssen",
        client_type="zzp",
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


def auth_header(client_obj, user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    client_obj.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")


class TestClientListEndpoint:
    def test_requires_auth(self, api):
        r = api.get("/api/portal/clients/")
        assert r.status_code == 401

    def test_accountant_sees_own_clients(self, api, accountant, profile):
        auth_header(api, accountant)
        r = api.get("/api/portal/clients/")
        assert r.status_code == 200
        assert any(c["id"] == profile.id for c in r.data)

    def test_other_accountant_cannot_see_clients(self, api, other_accountant, profile):
        auth_header(api, other_accountant)
        r = api.get("/api/portal/clients/")
        assert r.status_code == 200
        # Should be empty — other accountant's clients only
        assert not any(c["id"] == profile.id for c in r.data)

    def test_create_client(self, api, accountant):
        auth_header(api, accountant)
        r = api.post("/api/portal/clients/", {
            "email": "new@client.com",
            "first_name": "New",
            "client_type": "employee",
            "tax_year": 2026,
        }, format="json")
        assert r.status_code == 201
        assert r.data["email"] == "new@client.com"


class TestEngagementEndpoint:
    def test_create_engagement_generates_checklist(self, api, accountant, profile):
        auth_header(api, accountant)
        r = api.post("/api/portal/engagements/", {
            "client_profile": profile.id,
            "tax_year": 2026,
            "engagement_type": "income_tax",
        }, format="json")
        assert r.status_code == 201
        eng_id = r.data["id"]
        # Checklist should have been auto-generated
        count = ChecklistItem.objects.filter(engagement_id=eng_id).count()
        assert count > 0

    def test_cannot_access_other_accountants_engagement(self, api, other_accountant, engagement):
        auth_header(api, other_accountant)
        r = api.get(f"/api/portal/engagements/{engagement.id}/")
        assert r.status_code in (403, 404)


class TestReadinessEndpoint:
    def test_recalculate_returns_readiness(self, api, accountant, engagement):
        auth_header(api, accountant)
        r = api.post(f"/api/portal/engagements/{engagement.id}/recalculate-readiness/")
        assert r.status_code == 200
        assert "score" in r.data
        assert "ready_to_file" in r.data
        assert 0 <= r.data["score"] <= 100


class TestChecklistEndpoint:
    def test_get_checklist(self, api, accountant, engagement):
        auth_header(api, accountant)
        r = api.get(f"/api/portal/engagements/{engagement.id}/checklist/")
        assert r.status_code == 200
        assert isinstance(r.data, list)

    def test_update_checklist_item(self, api, accountant, engagement):
        auth_header(api, accountant)
        # Create a checklist item first
        item = ChecklistItem.objects.create(
            engagement=engagement,
            client_profile=engagement.client_profile,
            title="Test item",
            stable_key="test-item",
        )
        r = api.patch(f"/api/portal/checklist/{item.id}/", {"status": "accepted"}, format="json")
        assert r.status_code == 200
        assert r.data["status"] == "accepted"


class TestRisksEndpoint:
    def test_risks_returns_opportunities_and_risks(self, api, accountant, engagement):
        auth_header(api, accountant)
        r = api.get(f"/api/portal/engagements/{engagement.id}/risks/")
        assert r.status_code == 200
        assert "opportunities" in r.data
        assert "risks" in r.data
        assert isinstance(r.data["opportunities"], list)
        assert isinstance(r.data["risks"], list)


class TestAuditEndpoint:
    def test_audit_log_accessible(self, api, accountant, engagement):
        auth_header(api, accountant)
        r = api.get(f"/api/portal/engagements/{engagement.id}/audit/")
        assert r.status_code == 200
        assert isinstance(r.data, list)


class TestDocumentUploadEndpoint:
    def test_upload_requires_auth(self, api):
        r = api.post("/api/portal/documents/upload/")
        assert r.status_code == 401

    def test_upload_rejects_bad_mime(self, api, accountant, engagement):
        import io
        auth_header(api, accountant)
        fake_file = io.BytesIO(b"<script>alert(1)</script>")
        fake_file.name = "evil.html"
        from django.core.files.uploadedfile import InMemoryUploadedFile
        uploaded = InMemoryUploadedFile(
            fake_file, "file", "evil.html", "text/html", len(b"<script>"), None
        )
        r = api.post("/api/portal/documents/upload/", {
            "engagement": engagement.id,
            "client_profile": engagement.client_profile.id,
            "file": uploaded,
        }, format="multipart")
        assert r.status_code == 400
