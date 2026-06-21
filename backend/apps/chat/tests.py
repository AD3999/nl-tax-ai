"""
Phase 7 — Chat API endpoint tests.
Chat tests run in mock mode (ANTHROPIC_API_KEY patched to empty string)
so they are fast, offline, and never touch the Anthropic API.
"""
import json
import os
from unittest import mock

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


def _make_user(email, password="testpass", **kw):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    return User.objects.create_user(username=email, email=email, password=password, **kw)


def _auth(user):
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {str(RefreshToken.for_user(user).access_token)}")
    return c


def _stream_content(resp):
    """Decode a StreamingHttpResponse into a single string."""
    return b"".join(resp.streaming_content).decode("utf-8")


class ChatMessageMockTests(TestCase):
    """POST /api/chat/message/ in mock mode."""

    def setUp(self):
        self.client = APIClient()

    def _post(self, payload):
        # Patch the env var so views.py sees no API key → mock mode
        with mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": ""}, clear=False):
            return self.client.post("/api/chat/message/", payload, format="json")

    def test_returns_200_streaming(self):
        resp = self._post({"message": "What is zelfstandigenaftrek?"})
        self.assertEqual(resp.status_code, 200)

    def test_content_type_is_sse(self):
        resp = self._post({"message": "Hello"})
        self.assertEqual(resp["Content-Type"], "text/event-stream")

    def test_response_contains_sse_data(self):
        resp = self._post({"message": "Hello"})
        content = _stream_content(resp)
        self.assertIn("data:", content)

    def test_response_contains_done_event(self):
        resp = self._post({"message": "Hello"})
        content = _stream_content(resp)
        self.assertIn('"done"', content)

    def test_response_contains_text_tokens(self):
        resp = self._post({"message": "Hello"})
        content = _stream_content(resp)
        # At least one data event with a "text" key
        has_text = any(
            "text" in json.loads(line[6:])
            for line in content.splitlines()
            if line.startswith("data: ")
            and line[6:].strip()
        )
        self.assertTrue(has_text, "No text token events found in SSE stream")

    def test_empty_message_returns_400(self):
        resp = self.client.post("/api/chat/message/", {"message": ""}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_missing_message_returns_400(self):
        resp = self.client.post("/api/chat/message/", {}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_with_user_profile(self):
        resp = self._post({
            "message": "How much tax do I owe?",
            "user_profile": {
                "user_type": "zzp",
                "annual_revenue_zzp": 60000,
                "hours_per_year": 1300,
            },
        })
        self.assertEqual(resp.status_code, 200)

    def test_with_conversation_history(self):
        resp = self._post({
            "message": "And what about ZVW?",
            "conversation_history": [
                {"role": "user", "content": "What is the tax rate?"},
                {"role": "assistant", "content": "The Box 1 rate is 35.75%."},
            ],
        })
        self.assertEqual(resp.status_code, 200)


class IBFieldsAPITests(TestCase):
    """GET /api/tax/ib/fields/"""

    def setUp(self):
        self.client = APIClient()

    def test_returns_200(self):
        resp = self.client.get("/api/tax/ib/fields/")
        self.assertEqual(resp.status_code, 200)

    def test_returns_list(self):
        data = self.client.get("/api/tax/ib/fields/").json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_each_field_has_required_keys(self):
        for field in self.client.get("/api/tax/ib/fields/").json():
            self.assertIn("field_code", field)
            self.assertIn("plain_question_nl", field)
            self.assertIn("plain_question_en", field)
            self.assertIn("plain_question_fa", field)

    def test_user_type_filter_zzp(self):
        data = self.client.get("/api/tax/ib/fields/?user_type=zzp").json()
        self.assertGreater(len(data), 0)
        for field in data:
            user_types = field.get("user_types", [])
            self.assertTrue(
                "zzp" in user_types or "all" in user_types,
                f"Field {field['field_code']} returned for zzp but not tagged zzp/all",
            )

    def test_filtered_count_lte_total(self):
        total = len(self.client.get("/api/tax/ib/fields/").json())
        dga = len(self.client.get("/api/tax/ib/fields/?user_type=dga").json())
        self.assertLessEqual(dga, total)


# ── Admin chat log endpoint tests ─────────────────────────────────────────────

class AdminChatLogsTests(TestCase):
    """GET /api/chat/admin/logs/ — staff-only chat log access."""

    def setUp(self):
        from apps.chat.models import Conversation, Message
        self.staff = _make_user("staff@chat.test", is_staff=True)
        self.regular = _make_user("user@chat.test")

        self.conv = Conversation.objects.create(
            user=self.regular,
            language="nl",
            tax_year=2026,
            summary="Test conversation about ZZP taxes",
        )
        Message.objects.create(
            conversation=self.conv, role="user",
            content="Hoeveel belasting betaal ik?",
        )
        Message.objects.create(
            conversation=self.conv, role="assistant",
            content="Dat hangt af van uw inkomen.",
        )

    def test_anonymous_returns_401(self):
        r = APIClient().get("/api/chat/admin/logs/")
        self.assertEqual(r.status_code, 401)

    def test_non_staff_returns_403(self):
        r = _auth(self.regular).get("/api/chat/admin/logs/")
        self.assertEqual(r.status_code, 403)

    def test_staff_gets_200_with_conversations_key(self):
        r = _auth(self.staff).get("/api/chat/admin/logs/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("conversations", r.data)
        self.assertIn("total", r.data)

    def test_conversation_appears_in_list(self):
        r = _auth(self.staff).get("/api/chat/admin/logs/")
        ids = [c["id"] for c in r.data["conversations"]]
        self.assertIn(self.conv.id, ids)

    def test_search_by_summary(self):
        r = _auth(self.staff).get("/api/chat/admin/logs/?search=ZZP")
        self.assertEqual(r.status_code, 200)
        self.assertGreater(len(r.data["conversations"]), 0)

    def test_search_no_match_returns_empty(self):
        r = _auth(self.staff).get("/api/chat/admin/logs/?search=XYZNOTFOUND999")
        self.assertEqual(len(r.data["conversations"]), 0)

    def test_lang_filter(self):
        r = _auth(self.staff).get("/api/chat/admin/logs/?lang=nl")
        self.assertEqual(r.status_code, 200)
        for c in r.data["conversations"]:
            self.assertEqual(c["language"], "nl")


class AdminChatDetailTests(TestCase):
    """GET /api/chat/admin/logs/<pk>/ — staff-only conversation detail with messages."""

    def setUp(self):
        from apps.chat.models import Conversation, Message
        self.staff = _make_user("staff2@chat.test", is_staff=True)
        self.regular = _make_user("user2@chat.test")

        self.conv = Conversation.objects.create(
            user=self.regular, language="en", tax_year=2026,
        )
        Message.objects.create(conversation=self.conv, role="user", content="Hello")
        Message.objects.create(conversation=self.conv, role="assistant", content="Hi there")

    def test_anonymous_returns_401(self):
        r = APIClient().get(f"/api/chat/admin/logs/{self.conv.pk}/")
        self.assertEqual(r.status_code, 401)

    def test_non_staff_returns_403(self):
        r = _auth(self.regular).get(f"/api/chat/admin/logs/{self.conv.pk}/")
        self.assertEqual(r.status_code, 403)

    def test_staff_gets_conversation_with_messages(self):
        r = _auth(self.staff).get(f"/api/chat/admin/logs/{self.conv.pk}/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["id"], self.conv.pk)
        self.assertIn("messages", r.data)
        self.assertEqual(len(r.data["messages"]), 2)

    def test_messages_have_required_fields(self):
        r = _auth(self.staff).get(f"/api/chat/admin/logs/{self.conv.pk}/")
        for msg in r.data["messages"]:
            self.assertIn("id", msg)
            self.assertIn("role", msg)
            self.assertIn("content", msg)
            self.assertIn("created_at", msg)

    def test_unknown_conv_returns_404(self):
        r = _auth(self.staff).get("/api/chat/admin/logs/999999/")
        self.assertEqual(r.status_code, 404)
