"""
Phase 7 — Users app tests.

Covers:
  - RegisterView: create account (client + accountant)
  - ProfileView: read/update
  - JWT auth: obtain + refresh token
  - PushVapidKeyView: returns public key
  - PushSubscribeView: subscribe, duplicate upsert, unsubscribe
  - AccountantSetupView: create accountant profile

All tests run fully offline — no external APIs called.
"""
from unittest import mock

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User, AccountantProfile, PushSubscription


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_user(email, role="client", password="testpass123", **kw):
    return User.objects.create_user(
        username=email, email=email, password=password, role=role, **kw
    )


def _jwt(user):
    return str(RefreshToken.for_user(user).access_token)


def _auth(user):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {_jwt(user)}")
    return c


_FAKE_SUB = {
    "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint-abc123",
    "p256dh":   "BNcRdreALRFXTkOOUHK1EtK2wtLLDCOFPHrOjfqWhA0",
    "auth":     "tBHItJI5svbpez7KI4CCXg",
}


# ── Registration tests ────────────────────────────────────────────────────────

class RegisterTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_client_returns_201(self):
        resp = self.client.post("/api/users/register/", {
            "email": "newclient@test.com",
            "password": "StrongPass1!",
            "role": "client",
        }, format="json")
        self.assertEqual(resp.status_code, 201)

    def test_register_accountant_returns_201(self):
        resp = self.client.post("/api/users/register/", {
            "email": "newacct@test.com",
            "password": "StrongPass1!",
            "role": "accountant",
        }, format="json")
        self.assertEqual(resp.status_code, 201)

    def test_duplicate_email_rejected(self):
        _make_user("dup@test.com")
        resp = self.client.post("/api/users/register/", {
            "email": "dup@test.com",
            "password": "StrongPass1!",
            "role": "client",
        }, format="json")
        self.assertIn(resp.status_code, (400, 409))

    def test_response_contains_tokens(self):
        resp = self.client.post("/api/users/register/", {
            "email": "tokens@test.com",
            "password": "StrongPass1!",
            "role": "client",
        }, format="json")
        data = resp.json()
        self.assertIn("access", data)


# ── Auth token tests ──────────────────────────────────────────────────────────

class JWTAuthTests(TestCase):
    def setUp(self):
        self.user = _make_user("auth@test.com")
        self.client = APIClient()

    def test_obtain_token(self):
        resp = self.client.post("/api/auth/token/", {
            "email": "auth@test.com",
            "password": "testpass123",
        }, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.json())

    def test_wrong_password_returns_401(self):
        resp = self.client.post("/api/auth/token/", {
            "email": "auth@test.com",
            "password": "wrongpassword",
        }, format="json")
        self.assertEqual(resp.status_code, 401)

    def test_refresh_token(self):
        refresh = str(RefreshToken.for_user(self.user))
        resp = self.client.post("/api/auth/token/refresh/", {"refresh": refresh}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.json())


# ── Profile tests ─────────────────────────────────────────────────────────────

class ProfileTests(TestCase):
    def setUp(self):
        self.user = _make_user("profile@test.com")
        self.client = _auth(self.user)

    def test_get_profile_returns_200(self):
        resp = self.client.get("/api/users/profile/")
        self.assertEqual(resp.status_code, 200)

    def test_profile_contains_email(self):
        resp = self.client.get("/api/users/profile/")
        self.assertEqual(resp.json().get("email"), "profile@test.com")

    def test_unauthenticated_profile_returns_401(self):
        resp = APIClient().get("/api/users/profile/")
        self.assertIn(resp.status_code, (401, 403))


# ── Push subscription tests ───────────────────────────────────────────────────

class PushVapidKeyTests(TestCase):
    def test_vapid_key_endpoint_is_public(self):
        resp = APIClient().get("/api/users/push/vapid-key/")
        self.assertEqual(resp.status_code, 200)

    def test_vapid_key_response_has_public_key_field(self):
        resp = APIClient().get("/api/users/push/vapid-key/")
        self.assertIn("public_key", resp.json())


class PushSubscribeTests(TestCase):
    def setUp(self):
        self.user = _make_user("push@test.com")
        self.client = _auth(self.user)

    def test_subscribe_returns_201(self):
        resp = self.client.post("/api/users/push/subscribe/", _FAKE_SUB, format="json")
        self.assertEqual(resp.status_code, 201)

    def test_subscription_saved_to_db(self):
        self.client.post("/api/users/push/subscribe/", _FAKE_SUB, format="json")
        self.assertTrue(PushSubscription.objects.filter(user=self.user).exists())

    def test_duplicate_subscribe_upserts_not_duplicates(self):
        self.client.post("/api/users/push/subscribe/", _FAKE_SUB, format="json")
        self.client.post("/api/users/push/subscribe/", _FAKE_SUB, format="json")
        self.assertEqual(PushSubscription.objects.filter(user=self.user).count(), 1)

    def test_subscribe_missing_fields_returns_400(self):
        resp = self.client.post("/api/users/push/subscribe/", {"endpoint": "only"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_unsubscribe_removes_subscription(self):
        self.client.post("/api/users/push/subscribe/", _FAKE_SUB, format="json")
        self.client.delete("/api/users/push/subscribe/",
                           {"endpoint": _FAKE_SUB["endpoint"]}, format="json")
        self.assertFalse(PushSubscription.objects.filter(user=self.user).exists())

    def test_unsubscribe_unauthenticated_returns_401(self):
        resp = APIClient().delete("/api/users/push/subscribe/",
                                  {"endpoint": _FAKE_SUB["endpoint"]}, format="json")
        self.assertIn(resp.status_code, (401, 403))


# ── Accountant setup tests ────────────────────────────────────────────────────

class AccountantSetupTests(TestCase):
    def setUp(self):
        self.user = _make_user("acct@test.com", role="accountant")
        self.client = _auth(self.user)

    def test_accountant_setup_creates_profile(self):
        resp = self.client.post("/api/users/accountant/setup/", {
            "firm_name": "Belasting Bureau BV",
            "kvk_number": "12345678",
            "designation": "RB",
            "phone": "+31612345678",
        }, format="json")
        self.assertIn(resp.status_code, (200, 201))
        self.assertTrue(AccountantProfile.objects.filter(user=self.user).exists())

    def test_non_accountant_cannot_setup(self):
        client_user = _make_user("notacct@test.com", role="client")
        resp = _auth(client_user).post("/api/users/accountant/setup/", {
            "firm_name": "Fake Firm",
        }, format="json")
        self.assertIn(resp.status_code, (400, 403))


# ── Admin user management endpoint tests ─────────────────────────────────────

class AdminUserListTests(TestCase):
    """GET /api/users/admin/list/ — staff-only user list."""

    def setUp(self):
        self.staff = _make_user("staff@test.com", is_staff=True)
        self.regular = _make_user("regular@test.com")
        _make_user("alice@test.com", user_type="zzp", plan="premium")
        _make_user("bob@test.com",   user_type="employee", plan="free")

    def test_anonymous_returns_401(self):
        r = APIClient().get("/api/users/admin/list/")
        self.assertEqual(r.status_code, 401)

    def test_non_staff_returns_403(self):
        r = _auth(self.regular).get("/api/users/admin/list/")
        self.assertEqual(r.status_code, 403)

    def test_staff_gets_200_with_users_key(self):
        r = _auth(self.staff).get("/api/users/admin/list/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("users", r.data)
        self.assertIn("total", r.data)

    def test_all_created_users_appear(self):
        r = _auth(self.staff).get("/api/users/admin/list/")
        emails = {u["email"] for u in r.data["users"]}
        self.assertIn("alice@test.com", emails)
        self.assertIn("bob@test.com", emails)

    def test_search_filter(self):
        r = _auth(self.staff).get("/api/users/admin/list/?search=alice")
        self.assertEqual(r.status_code, 200)
        emails = [u["email"] for u in r.data["users"]]
        self.assertIn("alice@test.com", emails)
        self.assertNotIn("bob@test.com", emails)

    def test_plan_filter(self):
        r = _auth(self.staff).get("/api/users/admin/list/?plan=premium")
        self.assertEqual(r.status_code, 200)
        for u in r.data["users"]:
            self.assertEqual(u["plan"], "premium")

    def test_user_type_filter(self):
        r = _auth(self.staff).get("/api/users/admin/list/?user_type=zzp")
        self.assertEqual(r.status_code, 200)
        for u in r.data["users"]:
            self.assertEqual(u["user_type"], "zzp")


class AdminUserDetailTests(TestCase):
    """GET/PATCH /api/users/admin/<pk>/ — staff-only user detail & edit."""

    def setUp(self):
        self.staff = _make_user("staff2@test.com", is_staff=True)
        self.target = _make_user("target@test.com", plan="free")

    def test_anonymous_returns_401(self):
        r = APIClient().get(f"/api/users/admin/{self.target.pk}/")
        self.assertEqual(r.status_code, 401)

    def test_non_staff_returns_403(self):
        regular = _make_user("reg2@test.com")
        r = _auth(regular).get(f"/api/users/admin/{self.target.pk}/")
        self.assertEqual(r.status_code, 403)

    def test_staff_gets_user_detail(self):
        r = _auth(self.staff).get(f"/api/users/admin/{self.target.pk}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["email"], "target@test.com")
        self.assertIn("intake_profile", r.data)

    def test_staff_can_upgrade_plan(self):
        r = _auth(self.staff).patch(
            f"/api/users/admin/{self.target.pk}/",
            {"plan": "premium"},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["plan"], "premium")
        self.target.refresh_from_db()
        self.assertEqual(self.target.plan, "premium")

    def test_patch_unknown_user_returns_404(self):
        r = _auth(self.staff).patch("/api/users/admin/999999/", {"plan": "premium"}, format="json")
        self.assertEqual(r.status_code, 404)

    def test_staff_can_deactivate_user(self):
        r = _auth(self.staff).patch(
            f"/api/users/admin/{self.target.pk}/",
            {"is_active": False},
            format="json",
        )
        self.assertEqual(r.status_code, 200)
        self.target.refresh_from_db()
        self.assertFalse(self.target.is_active)
