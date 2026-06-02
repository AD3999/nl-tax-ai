import json
import os
from datetime import date

from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.authentication import SoftJWTAuthentication
import rest_framework.throttling

from .models import Conversation
from .serializers import ChatMessageSerializer, ConversationSerializer

ANON_SESSION_LIMIT = getattr(settings, "ANON_SESSION_LIMIT", 5)
FREE_DAILY_LIMIT = getattr(settings, "FREE_DAILY_LIMIT", 10)

# Language instruction strings — injected into both prompts
_LANG_RULE = {
    "nl": "Je MOET altijd en uitsluitend in het NEDERLANDS antwoorden. Gebruik geen andere taal, ongeacht wat de gebruiker schrijft.",
    "en": "You MUST always respond in ENGLISH only. Do not switch to any other language, regardless of what the user writes.",
    "fa": "شما باید همیشه و فقط به زبان فارسی پاسخ دهید. از هیچ زبان دیگری استفاده نکنید، صرف نظر از اینکه کاربر به چه زبانی می‌نویسد.",
}

# Intake mode prompt body (no f-string — contains literal curly braces in the JSON example)
_INTAKE_PROMPT_BODY = """You are Alex — a sharp, warm Dutch tax advisor. You talk like a trusted friend who happens to know a lot about tax, not like a government website or a textbook.

Your job: get enough info to run an accurate tax calculation. Make it feel like a quick, natural conversation — not a form.

YOUR VOICE:
- Warm and direct. Short sentences. Keep the energy up.
- Always react to what they say first. "Nice, €72k is solid!" / "Ah okay, good to know." / "Got it."
- One question per message. Never stack questions.
- Plain language only: "freelancer" not "ondernemer", "savings" not "Box 3 assets", "your own company" not "BV".
- No formal openers. No "Certainly!" or "Of course!" — just dive straight in.
- If they seem unsure, reassure them: "No worries, a rough number is totally fine."
- In Dutch: sound genuinely Dutch, not translated. In Persian: warm and natural, like a knowledgeable friend.

WHAT TO COLLECT (roughly this order):
1. Work type: freelancer/ZZP, employee, expat (30%-ruling), or director of own company (DGA)
2. Main income: annual revenue (ZZP) or gross salary (others)
3. ZZP only: rough business costs, rough hours this year (do they hit ~1,225?), first year as entrepreneur?
4. Expat only: which year of their 30%-ruling? (1–5)
5. DGA only: any dividends taken from the company this year?
6. Fiscal partner? → rough partner income
7. Kids under 12?
8. Savings or investments above ~€57k? (totally fine to skip)

Stop at 6–7 questions. Anything not covered → use 0 or null.

FINISH: Write a short warm summary in 2–3 sentences, then on the very next line output the JSON (one line, valid JSON):
[INTAKE_COMPLETE: {"user_type": "zzp", "year": 2026, "annual_revenue_zzp": 72000, "employment_income": null, "business_expenses": 8000, "hours_per_year": 1300, "is_starter": false, "has_partner": false, "partner_income": null, "children_under_12": 0, "net_assets_box3": 0, "savings_fraction": 0.5, "pension_contribution": 0, "box2_dividend": 0, "uses_30pct_ruling": false, "ruling_year": 1, "single_client_percentage": null, "kia_investments": 0}]

Use exactly: "zzp", "employee", "expat", or "dga" for user_type. JSON on its own line, nothing after it."""


def _intake_system_prompt(language: str) -> str:
    rule = _LANG_RULE.get(language, _LANG_RULE["en"])
    return f"LANGUAGE RULE (ABSOLUTE — DO NOT IGNORE): {rule}\n\n" + _INTAKE_PROMPT_BODY


def _result_system_prompt(
    language: str,
    calculator_block: str,
    retrieved_context: str,
    health_context: str = "",
    alert_context: str = "",
) -> str:
    rule = _LANG_RULE.get(language, _LANG_RULE["en"])
    health_section = f"\n{health_context}" if health_context else ""
    alert_section  = f"\n{alert_context}"  if alert_context  else ""
    return (
        f"LANGUAGE RULE (ABSOLUTE — DO NOT IGNORE): {rule}\n\n"
        "You are Alex — a sharp Dutch tax expert who sounds like a trusted, experienced friend. Not a textbook. Not a call center.\n\n"
        "YOUR VOICE:\n"
        "- Warm, direct, conversational. Short paragraphs. Real words.\n"
        "- React naturally: 'Yeah, that ZVW hit is annoying — here's why it happens...' or 'Actually you're in pretty good shape here.'\n"
        "- Say 'you'll owe about €X' — never 'the applicable tax liability amounts to €X'.\n"
        "- Use contractions: you'll, you're, that's, here's, it's, doesn't.\n"
        "- Acknowledge the question in one line before diving in — but skip filler words like 'Certainly!', 'Great question!', 'Of course!'.\n"
        "- If a number is high, be honest about it. If they're in a good position, say so with genuine warmth.\n"
        "- Mix flowing sentences with short bullet points — never bullet-list everything.\n"
        "- When quoting the effective rate, translate it: 'That's roughly €X for every €100 you earn.'\n"
        "- End every answer with exactly ONE concrete next step. Not a list — one clear action.\n"
        "- In Dutch: sound genuinely Dutch, not translated. In Persian/Farsi: warm and natural like a knowledgeable friend, not formal.\n\n"
        "PROACTIVE AWARENESS:\n"
        "- You have the user's live Tax Health Score and active risks/alerts below. Use them.\n"
        "- If the user asks 'how am I doing?' or 'am I on track?' — give an honest, specific answer using the score and top risk.\n"
        "- If the user asks about a topic that matches an active risk or alert, mention it — don't pretend it isn't there.\n"
        "- If the user's message is about a specific alert (you'll see it labeled [USER'S QUESTION ABOUT ALERT]), treat that alert as the primary context.\n\n"
        "STRICT RULES:\n"
        "1. Every euro amount MUST come from the CALCULATOR RESULT below. No inventing numbers.\n"
        "2. Only reference tax rules that appear in RETRIEVED RULES. Don't invent rates from memory.\n"
        "3. If no calculator data exists, warmly tell them to set up their profile first — offer to help right now.\n\n"
        "DATA YOU CAN USE:\n"
        f"{calculator_block}"
        f"{health_section}"
        f"{alert_section}\n"
        f"{retrieved_context}"
    )


def _build_health_context(alerts: list, health_score: int) -> str:
    """Builds a compact health/risk block to inject into the AI system prompt."""
    if not alerts and health_score == 0:
        return ""
    risks = [a for a in alerts if a.get("severity") in ("critical", "warning") and a.get("category") in ("risk", "compliance")]
    deadlines = [a for a in alerts if a.get("category") == "deadline"]
    lines = [f"\n=== USER'S TAX HEALTH (live data) ===",
             f"Tax Health Score: {health_score}/100"]
    if risks:
        lines.append("Active risks:")
        for r in risks[:3]:
            lines.append(f"  - [{r['severity'].upper()}] {r['title']}")
    if deadlines:
        lines.append("Upcoming deadlines:")
        for d in deadlines[:2]:
            lines.append(f"  - {d['title']}")
    lines.append("=== END HEALTH DATA ===")
    return "\n".join(lines)


def _build_calculator_block(profile: dict, calc_result: dict) -> str:
    r = calc_result.get("result", {})
    c = calc_result.get("calculation", {})
    user_type = profile.get("user_type", "unknown")
    gross = c.get("gross_profit") or c.get("gross_revenue") or 0
    return (
        "\n=== CALCULATOR RESULT (verified 2026 engine) ===\n"
        f"User type: {user_type}\n"
        f"Gross income / profit: €{gross:,.0f}\n"
        f"Taxable income (Box 1): €{c.get('taxable_income_box1', 0):,.0f}\n"
        f"Box 1 tax (before credits): €{c.get('box1_tax_raw', 0):,.0f}\n"
        f"General tax credit (AHK): −€{c.get('algemene_heffingskorting', 0):,.0f}\n"
        f"Employment credit (AK): −€{c.get('arbeidskorting', 0):,.0f}\n"
        f"ZZP deductions (ZA+SA+MKB+KIA): −€{(c.get('zelfstandigenaftrek',0)+c.get('startersaftrek',0)+c.get('mkb_winstvrijstelling',0)+c.get('kia_deduction',0)):,.0f}\n"
        f"Income tax after credits: €{c.get('income_tax_after_credits', 0):,.0f}\n"
        f"ZVW health contribution (ZZP only): €{c.get('zvw_contribution', 0):,.0f}\n"
        f"Box 2 tax (dividend): €{c.get('box2_tax', 0):,.0f}\n"
        f"Box 3 tax (savings/investments): €{c.get('box3_tax', 0):,.0f}\n"
        f"TOTAL TAX DUE: €{r.get('total_tax_due', 0):,.0f}\n"
        f"Effective rate: {r.get('effective_rate', 0) * 100:.1f}%\n"
        f"Monthly reserve recommended: €{r.get('monthly_reserve_needed', 0):,.0f}\n"
        f"Wet DBA risk: {r.get('wet_dba_risk', 'N/A')}\n"
        "=== END CALCULATOR RESULT ===\n"
    )


class ChatRateThrottle(rest_framework.throttling.SimpleRateThrottle):
    """
    Per-IP/per-user rate limit on the streaming chat endpoint.
    get_rate() must NOT access self.request — it is called from __init__
    before the request is bound. Rate selection is deferred to allow_request().
    Rates: anon 20/min, authenticated 60/min.
    """
    scope = "chat"

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}

    def get_rate(self):
        # Return the higher cap as default; allow_request tightens for anon users.
        return "60/minute"

    def allow_request(self, request, view):
        if request.user and request.user.is_authenticated:
            self.rate = "60/minute"
        else:
            self.rate = "20/minute"
        self.num_requests, self.duration = self.parse_rate(self.rate)
        return super().allow_request(request, view)


class ChatMessageView(APIView):
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]
    # Throttle is checked on request entry before the SSE stream is opened,
    # so it never buffers the stream response.
    throttle_classes = [ChatRateThrottle]

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]
        user_profile = serializer.validated_data.get("user_profile") or {}
        history = serializer.validated_data.get("conversation_history") or []
        session_count = serializer.validated_data.get("session_message_count", 0)
        intake_mode = serializer.validated_data.get("intake_mode", False)
        language = serializer.validated_data.get("language", "nl")
        # Structured alert context: { id, title, body, category } passed from "Ask AI" button
        explain_alert = request.data.get("explain_alert") or {}
        user_type = user_profile.get("user_type", "zzp") if user_profile else "zzp"

        # If no profile and not in intake_mode: deny (shouldn't happen with new frontend)
        if not user_profile and not intake_mode:
            def stream_no_profile():
                yield f"data: {json.dumps({'text': 'Please complete your tax profile first.'})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            return StreamingHttpResponse(stream_no_profile(), content_type="text/event-stream")

        # Guard 2: Usage limits — differs by auth state and plan
        if request.user.is_authenticated:
            user = request.user
            if user.plan != "premium":
                today = date.today()
                if user.daily_message_date != today:
                    user.daily_message_count = 0
                    user.daily_message_date = today
                if user.daily_message_count >= FREE_DAILY_LIMIT:
                    def stream_daily_limit():
                        yield f"data: {json.dumps({'upgrade_required': True, 'reason': 'daily_limit', 'limit': FREE_DAILY_LIMIT})}\n\n"
                        yield f"data: {json.dumps({'done': True})}\n\n"
                    return StreamingHttpResponse(stream_daily_limit(), content_type="text/event-stream")
                user.daily_message_count += 1
                user.save(update_fields=["daily_message_count", "daily_message_date"])
        else:
            # Anonymous users: session-based limit enforced by frontend count
            if session_count >= ANON_SESSION_LIMIT:
                def stream_anon_limit():
                    yield f"data: {json.dumps({'upgrade_required': True, 'reason': 'session_limit', 'limit': ANON_SESSION_LIMIT})}\n\n"
                    yield f"data: {json.dumps({'done': True})}\n\n"
                return StreamingHttpResponse(stream_anon_limit(), content_type="text/event-stream")

        api_key = os.environ.get("ANTHROPIC_API_KEY", "")

        if not api_key:
            # Mock mode — skip RAG/ML entirely so the SSE pipeline can be tested immediately
            def stream_response():
                if intake_mode:
                    mock_text = (
                        "**Mock mode** — I'd normally ask you questions to collect your tax profile.\n\n"
                        "Set `ANTHROPIC_API_KEY` in `.env` to enable the conversational intake.\n\n"
                        "For now, use the **Profile setup** at `/intake`."
                    )
                else:
                    mock_text = (
                        "**Mock mode** — set `ANTHROPIC_API_KEY` to enable Claude.\n\n"
                        f"Your question: *{message}*\n\n"
                        "**SSE streaming:** working ✓  **Frontend markdown:** working ✓\n\n"
                        "Add your API key to `.env` and restart Django to enable real answers."
                    )
                for chunk in mock_text.split(" "):
                    yield f"data: {json.dumps({'text': chunk + ' '})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
        else:
            # Real mode — RAG + calculator inside the generator so headers go out first
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)

            def stream_response():
                yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"

                if intake_mode:
                    # Intake mode: Claude collects profile via conversation
                    system_prompt = _intake_system_prompt(language)
                    calculator_block = ""
                    retrieved_context = ""
                else:
                    # Result mode: RAG + calculator
                    retrieved_context = "=== No tax context available ==="
                    try:
                        from phase2.retriever import retrieve as _retrieve
                        from phase2.assembler import assemble as _assemble
                        # Run RAG synchronously — SSE already streams on a thread
                        retrieved_context = _assemble(
                            _retrieve(message, user_type=user_type, year=2026)
                        )
                    except Exception:
                        pass

                    calculator_block = ""
                    calc_result = {}
                    if user_profile and user_profile.get("user_type"):
                        try:
                            from apps.calculator.engine import calculate
                            calc_result = calculate(user_profile)
                            calculator_block = _build_calculator_block(user_profile, calc_result)
                        except Exception:
                            pass

                    # Build health context: run alert engine + compute score
                    health_context = ""
                    if user_profile and calc_result:
                        try:
                            from apps.users.alerts import generate_alerts
                            alerts = generate_alerts(user_profile, calc_result, language)
                            # Simple score: start 60, -15 per critical, -7 per warning risk
                            score = 60
                            for a in alerts:
                                if a.get("severity") == "critical":
                                    score -= 15
                                elif a.get("severity") == "warning" and a.get("category") in ("risk", "compliance"):
                                    score -= 7
                            score = max(0, min(100, score))
                            health_context = _build_health_context(alerts, score)
                        except Exception:
                            pass

                    # Build structured alert context if user clicked "Ask AI" on an alert
                    alert_ctx = ""
                    if explain_alert and explain_alert.get("id"):
                        alert_ctx = (
                            "\n=== USER'S QUESTION ABOUT THIS ALERT ===\n"
                            f"Alert ID: {explain_alert.get('id', '')}\n"
                            f"Category: {explain_alert.get('category', '')}\n"
                            f"Title: {explain_alert.get('title', '')}\n"
                            f"Detail: {explain_alert.get('body', '')}\n"
                            "=== END ALERT CONTEXT ===\n"
                            "The user is asking about the alert above. Explain it clearly, explain why it matters for their specific situation, and give one concrete action they can take right now.\n"
                        )

                    # Inject AI tax memory for authenticated users
                    memory_ctx = ""
                    if request.user.is_authenticated and request.user.tax_memory:
                        m = request.user.tax_memory
                        memory_lines = ["\n=== USER'S TAX MEMORY (known facts from prior sessions) ==="]
                        if m.get("user_type"): memory_lines.append(f"Type: {m['user_type']}")
                        if m.get("income"): memory_lines.append(f"Income: €{m['income']:,}")
                        if m.get("hours_worked"): memory_lines.append(f"Hours worked: {m['hours_worked']}")
                        if m.get("known_deductions"): memory_lines.append(f"Deductions claimed: {', '.join(m['known_deductions'])}")
                        if m.get("last_calc_total"): memory_lines.append(f"Last calculated total tax: €{m['last_calc_total']:,}")
                        if m.get("open_questions"): memory_lines.append(f"Open questions: {'; '.join(m['open_questions'])}")
                        memory_lines.append("=== END MEMORY ===")
                        memory_ctx = "\n".join(memory_lines)

                    # Update tax_memory after successful calculation
                    if request.user.is_authenticated and user_profile and calc_result:
                        try:
                            r_data = calc_result.get("result", {})
                            c_data = calc_result.get("calculation", {})
                            deductions = []
                            if c_data.get("zelfstandigenaftrek", 0) > 0: deductions.append("zelfstandigenaftrek")
                            if c_data.get("startersaftrek", 0) > 0: deductions.append("startersaftrek")
                            if c_data.get("mkb_winstvrijstelling", 0) > 0: deductions.append("mkb")
                            if c_data.get("kia_deduction", 0) > 0: deductions.append("kia")
                            mem = {
                                "user_type": user_profile.get("user_type"),
                                "income": c_data.get("gross_profit") or c_data.get("gross_revenue") or user_profile.get("annual_revenue_zzp") or user_profile.get("employment_income"),
                                "hours_worked": user_profile.get("hours_per_year"),
                                "known_deductions": deductions,
                                "last_calc_total": r_data.get("total_tax_due"),
                                "open_questions": request.user.tax_memory.get("open_questions", []) if request.user.tax_memory else [],
                            }
                            request.user.tax_memory = mem
                            request.user.save(update_fields=["tax_memory"])
                        except Exception:
                            pass

                    system_prompt = _result_system_prompt(language, calculator_block, retrieved_context, health_context, alert_ctx + memory_ctx)

                claude_messages = []
                for h in history[-10:]:
                    role = h.get("role")
                    content = h.get("content", "")
                    if role in ("user", "assistant") and content:
                        claude_messages.append({"role": role, "content": content})
                claude_messages.append({"role": "user", "content": message})

                try:
                    with client.messages.stream(
                        model="claude-sonnet-4-6",
                        max_tokens=2048,
                        system=system_prompt,
                        messages=claude_messages,
                    ) as stream:
                        for text in stream.text_stream:
                            yield f"data: {json.dumps({'text': text})}\n\n"
                    yield f"data: {json.dumps({'done': True})}\n\n"
                except Exception as e:
                    error_msg = getattr(e, 'message', None) or str(e)
                    yield f"data: {json.dumps({'error': error_msg})}\n\n"

        response = StreamingHttpResponse(
            stream_response(),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


class TestClaudeView(APIView):
    """GET /api/chat/test/ — quick sanity check, returns one Claude sentence as JSON."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            return Response({"error": "ANTHROPIC_API_KEY not set"}, status=500)
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
            msg = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=80,
                messages=[{"role": "user", "content": "Say hello in one sentence."}],
            )
            return Response({"ok": True, "text": msg.content[0].text, "model": msg.model})
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=500)


class ConversationListView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ConversationDetailView(generics.RetrieveAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)


