/**
 * PostHog analytics wrapper.
 * GDPR-compliant: no cookies without consent, uses localStorage-based persistence.
 * All PII is excluded — we track event types and income_bracket (buckets), not raw numbers.
 *
 * Setup:
 *   VITE_POSTHOG_KEY=phc_... in .env
 *   PostHog is loaded lazily — no bundle impact if key is not set.
 */

type EventProperties = Record<string, string | number | boolean | null | undefined>;

let _posthog: {
  capture: (event: string, props?: EventProperties) => void;
  identify: (id: string, props?: EventProperties) => void;
  reset: () => void;
} | null = null;

function incomeTobracket(income: number | null | undefined): string {
  if (!income) return "unknown";
  if (income < 30000) return "<30k";
  if (income < 50000) return "30–50k";
  if (income < 75000) return "50–75k";
  if (income < 100000) return "75–100k";
  return "100k+";
}

async function getPosthog() {
  if (_posthog) return _posthog;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return null;
  try {
    const { default: posthog } = await import("posthog-js");
    posthog.init(key, {
      api_host: "https://app.posthog.com",
      capture_pageview: false,
      persistence: "localStorage",
      autocapture: false,
    });
    _posthog = posthog;
    return posthog;
  } catch {
    return null;
  }
}

export async function trackPageView(path: string) {
  const ph = await getPosthog();
  ph?.capture("page_view", { path });
}

export async function trackEvent(event: string, props?: EventProperties) {
  const ph = await getPosthog();
  ph?.capture(event, props);
}

export async function trackIntakeStarted() {
  trackEvent("intake_started");
}

export async function trackIntakeCompleted(userType: string, income: number | null) {
  trackEvent("intake_completed", { user_type: userType, income_bracket: incomeTobracket(income) });
}

export async function trackCalculationDone(userType: string, income: number | null) {
  trackEvent("calculation_done", { user_type: userType, income_bracket: incomeTobracket(income) });
}

export async function trackChatMessageSent() {
  trackEvent("chat_message_sent");
}

export async function trackDeductionCheckerStarted() {
  trackEvent("deduction_checker_started");
}

export async function trackDeductionCheckerCompleted(deductionCount: number) {
  trackEvent("deduction_checker_completed", { deduction_count: deductionCount });
}

export async function trackAlertDismissed(category: string) {
  trackEvent("alert_dismissed", { category });
}

export async function trackAlertActionClicked(category: string) {
  trackEvent("alert_action_clicked", { category });
}

export async function identifyUser(userId: number, userType: string) {
  const ph = await getPosthog();
  ph?.identify(String(userId), { user_type: userType });
}

export async function resetIdentity() {
  const ph = await getPosthog();
  ph?.reset();
}
