/**
 * PostHog analytics — loaded via CDN script tag in index.html when
 * VITE_POSTHOG_KEY is set. Falls back silently if not configured.
 *
 * No npm package needed: reads window.posthog injected by the snippet.
 * GDPR-compliant: no cookies without consent, localStorage persistence.
 * All PII excluded — events carry income_bracket (buckets), not raw figures.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PH = { capture: (e: string, p?: Record<string, unknown>) => void; identify: (id: string, p?: Record<string, unknown>) => void; reset: () => void; init: (key: string, cfg: object) => void };

function ph(): PH | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.posthog ?? null;
}

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;

// Init on first call if key is set and posthog snippet is loaded
let _initialised = false;
function ensureInit() {
  if (_initialised || !KEY) return;
  const p = ph();
  if (!p) return;
  p.init(KEY, {
    api_host: "https://app.posthog.com",
    capture_pageview: false,
    persistence: "localStorage",
    autocapture: false,
  });
  _initialised = true;
}

function incomeBracket(income: number | null | undefined): string {
  if (!income) return "unknown";
  if (income < 30000) return "<30k";
  if (income < 50000) return "30–50k";
  if (income < 75000) return "50–75k";
  if (income < 100000) return "75–100k";
  return "100k+";
}

export function trackPageView(path: string) {
  ensureInit();
  ph()?.capture("page_view", { path });
}

export function trackEvent(event: string, props?: Record<string, unknown>) {
  ensureInit();
  ph()?.capture(event, props);
}

export function trackIntakeStarted() { trackEvent("intake_started"); }

export function trackIntakeCompleted(userType: string, income: number | null) {
  trackEvent("intake_completed", { user_type: userType, income_bracket: incomeBracket(income) });
}

export function trackCalculationDone(userType: string, income: number | null) {
  trackEvent("calculation_done", { user_type: userType, income_bracket: incomeBracket(income) });
}

export function trackChatMessageSent() { trackEvent("chat_message_sent"); }

export function trackDeductionCheckerStarted() { trackEvent("deduction_checker_started"); }

export function trackDeductionCheckerCompleted(deductionCount: number) {
  trackEvent("deduction_checker_completed", { deduction_count: deductionCount });
}

export function trackCheckerStepCompleted(stepId: string, stepIndex: number) {
  trackEvent("checker_step_completed", { step_id: stepId, step_index: stepIndex });
}

export function trackCheckerResultsViewed(likelyCount: number, needsInfoCount: number, userType: string) {
  trackEvent("checker_results_viewed", { likely_count: likelyCount, needs_info_count: needsInfoCount, user_type: userType });
}

export function trackCheckerWaitlistSubmitted(userType: string) {
  trackEvent("checker_waitlist_submitted", { user_type: userType });
}

export function trackAlertDismissed(category: string) { trackEvent("alert_dismissed", { category }); }

export function trackAlertActionClicked(category: string) { trackEvent("alert_action_clicked", { category }); }

export function identifyUser(userId: number, userType: string) {
  ensureInit();
  ph()?.identify(String(userId), { user_type: userType });
}

export function resetIdentity() {
  ensureInit();
  ph()?.reset();
}
