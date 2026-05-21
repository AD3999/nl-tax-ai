import json
import os

from django.http import StreamingHttpResponse
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation
from .serializers import AskSerializer, ChatMessageSerializer, ConversationSerializer
from .tasks import generate_response

SYSTEM_PROMPT = """You are TaxWijs, a Dutch tax assistant for ZZP workers, employees, expats, and DGA directors.
You answer tax questions for tax year 2026. You support Dutch, English, and Persian equally.

RULES:
1. Never do arithmetic yourself. Always cite pre-calculated numbers from the context below.
2. Every factual claim must include the source_url from the retrieved rule.
3. Respond in the same language the user wrote in (Dutch, English, or Persian).
4. If the answer requires knowing the user's income, ask for it — do not guess.
5. Be concise but complete. Use markdown for clarity (bullet points, bold for amounts).
6. Never answer questions outside Dutch tax law for 2026.

{retrieved_context}

{calculator_block}"""


def _build_calculator_block(profile: dict, result: dict) -> str:
    return (
        "\n=== CALCULATOR RESULT (deterministic engine, 2026) ===\n"
        f"User type: {profile.get('user_type', 'unknown')}\n"
        f"Total tax due: €{result.get('total_tax', 0):,.0f}\n"
        f"Effective rate: {result.get('effective_rate', 0) * 100:.1f}%\n"
        f"Monthly reserve: €{result.get('monthly_reserve', 0):,.0f}\n"
        f"Wet DBA risk: {result.get('wet_dba_risk', 'N/A')}\n"
        "=== END CALCULATOR RESULT ===\n"
    )


class ChatMessageView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = serializer.validated_data["message"]
        user_profile = serializer.validated_data.get("user_profile") or {}
        history = serializer.validated_data.get("conversation_history") or []
        user_type = user_profile.get("user_type", "zzp") if user_profile else "zzp"

        api_key = os.environ.get("ANTHROPIC_API_KEY", "")

        if not api_key:
            # Mock mode — skip RAG/ML entirely so the SSE pipeline can be tested immediately
            def stream_response():
                mock_text = (
                    "**Mock mode** — set `ANTHROPIC_API_KEY` to enable Claude.\n\n"
                    f"Your question: *{message}*\n\n"
                    "**SSE streaming:** working ✓\n\n"
                    "**Frontend markdown:** working ✓\n\n"
                    "- Bullet lists render correctly\n"
                    "- **Bold text** works\n"
                    "- Code blocks work\n\n"
                    "Add your API key to `.env` and restart Django to enable real answers."
                )
                for chunk in mock_text.split(" "):
                    yield f"data: {json.dumps({'text': chunk + ' '})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
        else:
            # Real mode — do RAG + calculator inside the generator so headers go out first
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)

            def stream_response():
                # RAG retrieval (runs inside generator — headers already sent)
                retrieved_context = "=== No tax context available ==="
                try:
                    from phase2.retriever import retrieve
                    from phase2.assembler import assemble
                    chunks = retrieve(message, user_type=user_type, year=2026)
                    retrieved_context = assemble(chunks)
                except Exception:
                    pass

                # Calculator block (only if profile supplied)
                calculator_block = ""
                if user_profile and user_profile.get("user_type"):
                    try:
                        from apps.calculator.engine import calculate
                        calc_result = calculate(user_profile)
                        calculator_block = _build_calculator_block(user_profile, calc_result)
                    except Exception:
                        pass

                system_prompt = SYSTEM_PROMPT.format(
                    retrieved_context=retrieved_context,
                    calculator_block=calculator_block,
                )

                messages = []
                for h in history[-10:]:
                    role = h.get("role")
                    content = h.get("content", "")
                    if role in ("user", "assistant") and content:
                        messages.append({"role": role, "content": content})
                messages.append({"role": "user", "content": message})

                try:
                    with client.messages.stream(
                        model="claude-sonnet-4-6",
                        max_tokens=1024,
                        system=system_prompt,
                        messages=messages,
                    ) as stream:
                        for text in stream.text_stream:
                            yield f"data: {json.dumps({'text': text})}\n\n"
                    yield f"data: {json.dumps({'done': True})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"

        response = StreamingHttpResponse(
            stream_response(),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response


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


class AskView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question = serializer.validated_data["question"]
        language = serializer.validated_data.get("language", request.user.preferred_language)
        conversation_id = serializer.validated_data.get("conversation_id")

        # Get or create conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, user=request.user)
            except Conversation.DoesNotExist:
                return Response({"detail": "Conversation not found."}, status=404)
        else:
            conversation = Conversation.objects.create(
                user=request.user,
                language=language,
                tax_year=request.user.tax_year,
            )

        # Dispatch async task — response is generated by Celery worker
        task = generate_response.delay(
            conversation_id=conversation.id,
            question=question,
            user_type=request.user.user_type,
            language=language,
        )

        return Response(
            {"task_id": task.id, "conversation_id": conversation.id},
            status=status.HTTP_202_ACCEPTED,
        )
