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
