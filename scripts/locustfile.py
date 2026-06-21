"""
TaxWijs Load Test — Locust

Tests the main API endpoints under concurrent load.
Focus: the chat streaming endpoint, calculator, and reminders API.

Usage:
    pip install locust
    locust -f scripts/locustfile.py --host http://localhost:8000

Then open http://localhost:8089 to start the test.

Recommended test scenarios:
  - Smoke test:  5 users, ramp 1/s, 60s duration
  - Load test:  50 users, ramp 5/s, 5min duration
  - Stress test: 200 users, ramp 10/s, 10min duration

Key metrics to watch:
  - /api/chat/message/ : p95 < 3000ms (SSE first byte, not full stream)
  - /api/calculator/calculate/ : p95 < 500ms (deterministic, no AI)
  - /api/users/reminders/ : p95 < 200ms
  - /api/users/alerts/ : p95 < 300ms
  - Error rate: < 1%
"""

import json
import random
from locust import HttpUser, task, between, events

# ── Sample data ────────────────────────────────────────────────────────────────

SAMPLE_PROFILES = [
    {"user_type": "zzp", "annual_revenue_zzp": 50000, "business_expenses": 8000, "hours_per_year": 1300, "is_starter": False, "has_partner": False, "partner_income": 0, "children_under_12": 0, "net_assets_box3": 0, "savings_fraction": 0.5, "pension_contribution": 0, "kia_investments": 0, "box2_dividend": 0, "uses_30pct_ruling": False, "ruling_year": 1, "single_client_percentage": 60, "year": 2026},
    {"user_type": "zzp", "annual_revenue_zzp": 72000, "business_expenses": 12000, "hours_per_year": 1400, "is_starter": True, "has_partner": True, "partner_income": 35000, "children_under_12": 1, "net_assets_box3": 45000, "savings_fraction": 0.8, "pension_contribution": 2000, "kia_investments": 3000, "box2_dividend": 0, "uses_30pct_ruling": False, "ruling_year": 1, "single_client_percentage": 40, "year": 2026},
    {"user_type": "employee", "employment_income": 55000, "has_partner": True, "partner_income": 28000, "children_under_12": 0, "net_assets_box3": 80000, "savings_fraction": 0.6, "pension_contribution": 0, "year": 2026},
    {"user_type": "expat", "employment_income": 90000, "uses_30pct_ruling": True, "ruling_year": 2, "has_partner": False, "net_assets_box3": 20000, "year": 2026},
    {"user_type": "dga", "employment_income": 56000, "box2_dividend": 40000, "has_partner": False, "net_assets_box3": 120000, "year": 2026},
]

SAMPLE_QUESTIONS = [
    "Hoeveel belasting betaal ik als ZZP'er?",
    "Wat is de zelfstandigenaftrek in 2026?",
    "How does the 30% ruling work?",
    "چه مالیاتی باید بپردازم؟",
    "Wanneer is de BTW-aangifte deadline?",
    "What is the MKB-winstvrijstelling?",
    "Explain my tax health score",
    "Am I eligible for the startersaftrek?",
]


class TaxWijsUser(HttpUser):
    """
    Simulates a typical TaxWijs user session:
    - Most time is spent on anonymous or authenticated browsing
    - Occasionally submits a chat message or tax calculation
    """
    wait_time = between(1, 5)

    def on_start(self):
        """Set up a user profile for the session."""
        self.profile = random.choice(SAMPLE_PROFILES)

    # ── Public / lightweight endpoints (highest frequency) ─────────────────────

    @task(5)
    def health_check(self):
        self.client.get("/api/users/health/", name="/api/health")

    @task(4)
    def get_reminders(self):
        self.client.get("/api/users/reminders/?lang=nl&days=90", name="/api/reminders")

    @task(3)
    def get_alerts(self):
        self.client.get("/api/users/alerts/", name="/api/alerts")

    # ── Calculator (medium frequency) ─────────────────────────────────────────

    @task(3)
    def calculate_tax(self):
        with self.client.post(
            "/api/calculator/calculate/",
            json=self.profile,
            name="/api/calculator",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if not data.get("result"):
                    resp.failure("Missing result in response")
            else:
                resp.failure(f"HTTP {resp.status_code}")

    # ── Chat endpoint (lower frequency — expensive, SSE) ──────────────────────

    @task(2)
    def send_chat_message(self):
        """
        Sends a chat message and reads the SSE stream partially.
        We read the first 2KB only — enough to verify streaming works
        without holding the connection open for the full response.
        """
        payload = {
            "message": random.choice(SAMPLE_QUESTIONS),
            "user_profile": self.profile,
            "conversation_history": [],
            "session_message_count": 0,
            "intake_mode": False,
            "language": random.choice(["nl", "en", "fa"]),
        }
        with self.client.post(
            "/api/chat/message/",
            json=payload,
            name="/api/chat/message",
            stream=True,
            catch_response=True,
            timeout=15,
        ) as resp:
            if resp.status_code == 200:
                # Read first chunk to confirm streaming started
                first_chunk = b""
                try:
                    for chunk in resp.iter_content(chunk_size=512):
                        first_chunk += chunk
                        if len(first_chunk) >= 512:
                            break
                except Exception:
                    pass
                if b"data:" not in first_chunk and b"heartbeat" not in first_chunk:
                    resp.failure("No SSE data in first chunk")
                else:
                    resp.success()
            elif resp.status_code == 429:
                resp.success()  # Rate limit is expected under load
            else:
                resp.failure(f"HTTP {resp.status_code}")

    # ── Email capture / lead (low frequency) ──────────────────────────────────

    @task(1)
    def email_capture(self):
        self.client.post(
            "/api/users/email-capture/",
            json={"email": f"loadtest+{random.randint(1,999999)}@example.com", "user_type": "zzp", "source_page": "landing"},
            name="/api/email-capture",
        )


class AuthenticatedUser(TaxWijsUser):
    """
    Simulates a logged-in premium user.
    Requires TEST_USERNAME and TEST_PASSWORD env vars to be set.
    If not set, these users are skipped.
    """
    wait_time = between(2, 8)

    def on_start(self):
        import os
        super().on_start()
        username = os.environ.get("TEST_USERNAME", "")
        password = os.environ.get("TEST_PASSWORD", "")
        if not username or not password:
            self.environment.runner.quit()
            return
        resp = self.client.post(
            "/api/users/token/",
            json={"username": username, "password": password},
        )
        if resp.status_code == 200:
            self.token = resp.json().get("access", "")
        else:
            self.token = ""

    def _auth(self):
        return {"Authorization": f"Bearer {self.token}"} if self.token else {}

    @task(3)
    def get_profile(self):
        self.client.get("/api/users/profile/", headers=self._auth(), name="/api/profile")

    @task(2)
    def get_dashboard(self):
        self.client.get("/api/users/alerts/", headers=self._auth(), name="/api/dashboard-alerts")
        self.client.get("/api/users/actions/", headers=self._auth(), name="/api/dashboard-actions")

    @task(1)
    def get_tax_history(self):
        self.client.get("/api/users/snapshots/", headers=self._auth(), name="/api/snapshots")


# ── Event hooks for custom reporting ──────────────────────────────────────────

@events.quitting.add_listener
def on_quitting(environment, **kwargs):
    stats = environment.stats.total
    print(f"\n{'='*60}")
    print(f"TaxWijs Load Test Summary")
    print(f"  Requests:    {stats.num_requests:,}")
    print(f"  Failures:    {stats.num_failures:,} ({stats.fail_ratio*100:.1f}%)")
    print(f"  RPS:         {stats.current_rps:.1f}")
    print(f"  p50 latency: {stats.get_response_time_percentile(0.5):.0f}ms")
    print(f"  p95 latency: {stats.get_response_time_percentile(0.95):.0f}ms")
    print(f"  p99 latency: {stats.get_response_time_percentile(0.99):.0f}ms")
    print(f"{'='*60}\n")

    # Fail CI if error rate > 1% or p95 latency > 5000ms
    if stats.fail_ratio > 0.01:
        raise SystemExit(f"FAIL: error rate {stats.fail_ratio*100:.1f}% exceeds 1% threshold")
    p95 = stats.get_response_time_percentile(0.95)
    if p95 and p95 > 5000:
        raise SystemExit(f"FAIL: p95 latency {p95:.0f}ms exceeds 5000ms threshold")
