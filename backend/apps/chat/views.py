import json
import os
from datetime import date

from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from config.authentication import SoftJWTAuthentication

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
_INTAKE_PROMPT_BODY = """You are Alex — a Dutch tax advisor who talks like a smart friend, not a government official.

Your job: find out enough about the user's situation to run an accurate tax calculation. Make it feel like a quick friendly chat, not a form.

HOW TO TALK:
- Be warm, direct, and conversational. Short sentences. Keep energy up.
- Always acknowledge what they say first ("Nice, €72k is a solid year!") then ask your next question.
- One question at a time. Never more.
- Use normal words: "freelancer" not "ondernemer", "side savings" not "Box 3 assets".
- Skip formal openers — just dive in.
- It's totally fine to say things like "ah okay", "got it", "that's helpful", "good to know".

WHAT YOU NEED TO COLLECT (in roughly this order):
1. Work type: freelancer (ZZP), employee, expat (30%-ruling), or director with their own company (DGA)
2. Main income: revenue for ZZP, salary for others
3. ZZP only: rough expenses, rough hours this year (do they clear 1,225?), first year as entrepreneur?
4. Expat only: which year of their 30%-ruling?
5. DGA only: how much dividend did they take from the BV?
6. Fiscal partner? If yes, roughly what does the partner earn?
7. Kids under 12?
8. Any savings or investments? (optional — totally fine to skip)

Max 6 questions. Anything not mentioned → use 0 or null.

WHEN YOU HAVE ENOUGH — write a short friendly summary, then on the very last line output the JSON block (must be on its own line, valid JSON):
[INTAKE_COMPLETE: {"user_type": "zzp", "year": 2026, "annual_revenue_zzp": 72000, "employment_income": null, "business_expenses": 8000, "hours_per_year": 1300, "is_starter": false, "has_partner": false, "partner_income": null, "children_under_12": 0, "net_assets_box3": 0, "savings_fraction": 0.5, "pension_contribution": 0, "box2_dividend": 0, "uses_30pct_ruling": false, "ruling_year": 1, "single_client_percentage": null, "kia_investments": 0}]

Use exactly: "zzp", "employee", "expat", or "dga" for user_type. JSON on one line."""


def _intake_system_prompt(language: str) -> str:
    rule = _LANG_RULE.get(language, _LANG_RULE["en"])
    return f"LANGUAGE RULE (ABSOLUTE — DO NOT IGNORE): {rule}\n\n" + _INTAKE_PROMPT_BODY


def _result_system_prompt(language: str, calculator_block: str, retrieved_context: str) -> str:
    rule = _LANG_RULE.get(language, _LANG_RULE["en"])
    return (
        f"LANGUAGE RULE (ABSOLUTE — DO NOT IGNORE): {rule}\n\n"
        "You are Alex — a Dutch tax expert who talks like a smart, trusted friend. Never like a textbook or a government website.\n\n"
        "YOUR VOICE:\n"
        "- Conversational, warm, direct. Short paragraphs. Real words.\n"
        "- Say 'you'll owe about €X' — not 'the applicable tax liability amounts to €X'.\n"
        "- Use contractions naturally: you'll, you're, that's, here's, it's.\n"
        "- Acknowledge the question briefly before answering. 'Good question — your ZVW contribution is...'\n"
        "- If a number is high, say so honestly. If they're in a good spot, say that too.\n"
        "- Skip filler openers: never start with 'Based on the information provided', 'Certainly!', 'Of course!', or 'Great question!'.\n"
        "- Never use bullet lists for everything — mix in flowing sentences so it reads like a conversation.\n"
        "- When quoting the effective rate, always add the plain-English version: 'so for every €100 you earn, about €X goes to tax'.\n"
        "- End with one concrete, actionable next step — not a list of suggestions.\n\n"
        "STRICT RULES:\n"
        "1. Every euro amount you state MUST come from the CALCULATOR RESULT below. Zero exceptions.\n"
        "2. Only reference tax rules that appear in RETRIEVED RULES. Don't invent rates from memory.\n"
        "3. If no calculator data is available, tell them warmly to set up their profile first.\n\n"
        "DATA YOU CAN USE:\n"
        f"{calculator_block}\n"
        f"{retrieved_context}"
    )


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


class ChatMessageView(APIView):
    authentication_classes = [SoftJWTAuthentication]
    permission_classes = [permissions.AllowAny]
    throttle_classes = []  # SSE: throttle middleware would buffer the stream

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]
        user_profile = serializer.validated_data.get("user_profile") or {}
        history = serializer.validated_data.get("conversation_history") or []
        session_count = serializer.validated_data.get("session_message_count", 0)
        intake_mode = serializer.validated_data.get("intake_mode", False)
        language = serializer.validated_data.get("language", "nl")
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
                        import concurrent.futures
                        from phase2.retriever import retrieve as _retrieve
                        from phase2.assembler import assemble as _assemble

                        def _run_rag():
                            return _assemble(_retrieve(message, user_type=user_type, year=2026))

                        _exc = concurrent.futures.ThreadPoolExecutor(max_workers=1)
                        _fut = _exc.submit(_run_rag)
                        _exc.shutdown(wait=False)
                        retrieved_context = _fut.result(timeout=8)
                    except Exception:
                        pass

                    calculator_block = ""
                    if user_profile and user_profile.get("user_type"):
                        try:
                            from apps.calculator.engine import calculate
                            calc_result = calculate(user_profile)
                            calculator_block = _build_calculator_block(user_profile, calc_result)
                        except Exception:
                            pass

                    system_prompt = _result_system_prompt(language, calculator_block, retrieved_context)

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
                        max_tokens=1024,
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


