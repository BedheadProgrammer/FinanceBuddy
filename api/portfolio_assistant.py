from __future__ import annotations

import json
import os
import re
from typing import Dict, List

from openai import OpenAI
from dotenv import load_dotenv

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

load_dotenv()
client = OpenAI()

PORTFOLIO_ASSISTANT_MODEL = os.environ.get("OPENAI_PORTFOLIO_ASSISTANT_MODEL", "gpt-4o-mini")


def _strip_formatting(text: str) -> str:
    text = re.sub(r"^\s*#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*[-*•]\s*", "", text, flags=re.MULTILINE)
    text = text.replace("**", "").replace("__", "")
    text = text.replace("*", "").replace("_", "")
    return text.strip()


@csrf_exempt
@require_POST
def portfolio_assistant(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    snapshot = payload.get("snapshot")
    if not isinstance(snapshot, dict) or "portfolio" not in snapshot:
        return JsonResponse(
            {"error": "snapshot with portfolio summary is required"},
            status=400,
        )

    raw_messages = payload.get("messages")
    single_message = payload.get("message")

    user_messages: List[Dict[str, str]] = []

    if isinstance(raw_messages, list) and raw_messages:
        for m in raw_messages:
            role = m.get("role")
            content = str(m.get("content") or "").strip()
            if role in ("user", "assistant") and content:
                user_messages.append({"role": role, "content": content})
    elif isinstance(single_message, str) and single_message.strip():
        user_messages.append({"role": "user", "content": single_message.strip()})
    else:
        return JsonResponse({"error": "message or messages is required"}, status=400)

    system_prompt = (
        "You are FinanceBud, a portfolio and risk education assistant inside the FinanceBuddy app. "
        "You receive snapshots of a user's virtual stock portfolio as JSON and explain what is going on. "
        "The snapshot includes 'portfolio' (id, name, currency, initial_cash, cash_balance, "
        "positions_value, total_equity) and 'positions' (symbol, quantity, avg_cost, market_price, "
        "market_value, unrealized_pnl, error) plus an optional 'market_error'. "
        "Write an extended overview of their portfolio designed to teach. "
        "Explain cash versus invested value versus total equity, highlight big winners and losers, "
        "identify concentration risk, and point out anything unusual. "
        "Explain the portfolio and teach them about the stocks they have traded and how those trades "
        "affect their risk and P/L. "
        "If the user asks questions like 'why did AAPL drop according to the news "
       "You are supposed to access the internet and answer which news stories might have impacted the stock in question"
        "Respond in plain text only. Do not use markdown, headings, bullet points, hash characters (#), "
        "asterisks (*), or any other special formatting syntax such as ** or lists. "
        "Write short, clear paragraphs separated by blank lines if needed and keep answers concise, "
        "structured, and educational."
    )

    snapshot_text = json.dumps(snapshot, separators=(",", ":"), ensure_ascii=False)

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {
            "role": "system",
            "content": f"Here is the latest portfolio snapshot as JSON: {snapshot_text}",
        },
    ]
    messages.extend(user_messages)

    try:
        resp = client.responses.create(
            model=PORTFOLIO_ASSISTANT_MODEL,
            input=messages,
            tools=[{"type": "web_search"}],
        )
    except Exception as e:
        return JsonResponse(
            {"error": "OpenAI request failed", "detail": str(e)},
            status=500,
        )

    reply_text = getattr(resp, "output_text", None)
    if not reply_text and getattr(resp, "output", None):
        try:
            first = resp.output[0]
            if first and getattr(first, "content", None):
                reply_text = first.content[0].text
        except Exception:
            reply_text = None

    if not reply_text:
        return JsonResponse({"error": "Assistant returned no text"}, status=500)

    reply_text = _strip_formatting(str(reply_text))

    return JsonResponse({"reply": reply_text})
