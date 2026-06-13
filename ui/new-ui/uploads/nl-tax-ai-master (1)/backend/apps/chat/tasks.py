"""
Celery tasks for async AI response generation.

The HTTP request returns immediately with a task_id.
The client polls GET /api/chat/tasks/{task_id}/ for the result.
This keeps Claude API latency (2-8s) off the HTTP request cycle.
"""

from celery import shared_task


@shared_task(bind=True, max_retries=2)
def generate_response(self, conversation_id: int, question: str, user_type: str, language: str):
    """
    Retrieve relevant tax knowledge and generate a Claude response.
    Phase 4 will implement the full AI pipeline here.
    """
    from .models import Conversation, Message

    try:
        conversation = Conversation.objects.get(id=conversation_id)

        # Phase 4: call retriever → assembler → Claude API
        # For now, store the question and return a placeholder
        Message.objects.create(
            conversation=conversation,
            role="user",
            content=question,
        )
        Message.objects.create(
            conversation=conversation,
            role="assistant",
            content="[AI response pipeline not yet connected — Phase 4]",
        )

        return {"status": "ok", "conversation_id": conversation_id}

    except Exception as exc:
        raise self.retry(exc=exc, countdown=2)
