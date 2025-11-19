# api/views.py
from __future__ import annotations

import json
import os
from typing import Dict, List

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from BE1.MRKT_WTCH import get_current_prices, POPULAR

from openai import OpenAI
from openai._exceptions import OpenAIError  # type: ignore[attr-defined]

# Single shared OpenAI client; uses OPENAI_API_KEY from the environment
# as described in the OpenAI API docs.
_client = OpenAI()
_ASSISTANT_ID = os.getenv("OPENAI_ASSISTANT_ID")


@require_GET
def prices(request: HttpRequest) -> JsonResponse:
    """
    Existing market prices endpoint used by the Dashboard.
    (Left exactly as it was.)
    """
    raw = request.GET.get("symbols", "")
    symbols = [s.strip().upper() for s in raw.split(",") if s.strip()] or POPULAR
    data = get_current_prices(symbols)
    return JsonResponse(data)


@csrf_exempt
@require_POST
def assistant_chat(request: HttpRequest) -> JsonResponse:
    """
    Chat endpoint that proxies to the FinanceBud Assistant via the Assistants API.

    Request JSON:
        {
          "message": "string",            # required user message
          "thread_id": "thread_...",      # optional existing thread id to continue chat
          "metadata": { ... }             # optional dict we pass as run.metadata
        }

    Response JSON:
        {
          "thread_id": "thread_...",
          "reply": "assistant reply text",
          "messages": [
            {"role": "user", "content": "hi"},
            {"role": "assistant", "content": "hello ..."},
            ...
          ]
        }

    Flow (per Assistants API docs):
      1) Create or fetch a Thread
      2) Add a user Message to that Thread
      3) Create a Run for your FinanceBud assistant and wait until it completes
      4) List Messages from the Thread and return the latest assistant reply
    """

    if _ASSISTANT_ID is None:
        return JsonResponse(
            {
                "error": (
                    "OPENAI_ASSISTANT_ID is not set on the server. "
                    "Set it to your FinanceBud assistant id (asst_...)."
                )
            },
            status=500,
        )

    # Parse JSON body
    try:
        body = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON payload"}, status=400)

    user_message = (body.get("message") or "").strip()
    thread_id = body.get("thread_id") or None
    run_metadata = body.get("metadata") or None

    if not user_message:
        return JsonResponse({"error": "'message' is required"}, status=400)

    try:
        # 1) Create or retrieve the Thread
        if thread_id:
            # Confirm the thread exists; will raise if not
            thread = _client.beta.threads.retrieve(thread_id=thread_id)
        else:
            thread = _client.beta.threads.create()

        # 2) Append the user message
        _client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=user_message,
        )

        # 3) Create a Run and block until it finishes (create_and_poll helper)
        # See the Assistants docs / examples for this pattern.
        run = _client.beta.threads.runs.create_and_poll(
            thread_id=thread.id,
            assistant_id=_ASSISTANT_ID,
            metadata=run_metadata,
        )

        if run.status != "completed":
            # Surface non-successful status to the frontend
            return JsonResponse(
                {
                    "error": "Assistant run did not complete successfully.",
                    "status": run.status,
                },
                status=502,
            )

        # 4) Retrieve all messages and convert to a simple [{role, content}] list
        #    We request ascending order for an already-chronological transcript.
        messages_page = _client.beta.threads.messages.list(
            thread_id=thread.id,
            order="asc",
        )

        chat_messages: List[Dict[str, str]] = []
        latest_reply_text = ""

        for msg in messages_page.data:
            text_chunks: List[str] = []
            for c in msg.content:
                # Text content blocks per Messages API docs
                if getattr(c, "type", None) == "text":
                    text_chunks.append(c.text.value)  # type: ignore[union-attr]

            if not text_chunks:
                continue

            merged_text = "\n".join(text_chunks).strip()
            if not merged_text:
                continue

            role = msg.role  # "user" or "assistant"
            chat_messages.append({"role": role, "content": merged_text})
            if role == "assistant":
                latest_reply_text = merged_text

        if not latest_reply_text:
            latest_reply_text = "(No assistant reply was returned for this run.)"

        return JsonResponse(
            {
                "thread_id": thread.id,
                "reply": latest_reply_text,
                "messages": chat_messages,
            }
        )

    except OpenAIError as e:
        return JsonResponse(
            {"error": f"OpenAI API error: {getattr(e, 'message', str(e))}"},
            status=502,
        )
    except Exception as e:  # generic safety net
        return JsonResponse({"error": str(e)}, status=500)
