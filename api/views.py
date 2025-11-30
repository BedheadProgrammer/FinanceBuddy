from __future__ import annotations

import json
import os
from typing import Dict, List

from openai import OpenAI
from dotenv import load_dotenv

from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from BE1.MRKT_WTCH import get_current_prices, POPULAR

load_dotenv()
client = OpenAI()


@require_GET
def prices(request: HttpRequest) -> JsonResponse:

    raw = request.GET.get("symbols", "")
    symbols = [s.strip().upper() for s in raw.split(",") if s.strip()] or POPULAR
    data = get_current_prices(symbols)
    return JsonResponse(data)

@csrf_exempt
@require_POST
def american_assistant(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    snapshot = payload.get("snapshot")
    if not isinstance(snapshot, dict) or "inputs" not in snapshot or "american_result" not in snapshot:
        return JsonResponse(
            {"error": "snapshot with inputs and american_result is required"},
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
        "You are FinanceBud, an options-education assistant inside the FinanceBuddy app. "
        "You receive snapshots of American option pricing runs as JSON and explain them to the user. "
        "The snapshot has two keys: 'inputs' (pricing inputs like S, K, r, q, sigma, T, side, symbol, "
        "as_of, expiry, d1, d2) and 'american_result' (american_price, european_price, "
        "early_exercise_premium, critical_price).  When you structure your response give the real world names not the data point names"
        "Explain what the numbers mean in plain English, focusing on intuition, risk, and exercise logic. "
        "Keep answers concise and structured with short paragraphs or bullet points."
    )

    snapshot_text = json.dumps(snapshot, separators=(",", ":"), ensure_ascii=False)

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {
            "role": "system",
            "content": f"Here is the latest American option snapshot as JSON: {snapshot_text}",
        },
    ]
    messages.extend(user_messages)

    try:
        resp = client.responses.create(
            model=os.getenv("OPENAI_ASSISTANT_MODEL", "gpt-5-nano"),
            input=messages,
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

    return JsonResponse({"reply": reply_text})



@csrf_exempt
@require_POST
def euro_assistant(request: HttpRequest) -> JsonResponse:
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    snapshot = payload.get("snapshot")
    if not isinstance(snapshot, dict) or "inputs" not in snapshot or "price_and_greeks" not in snapshot:
        return JsonResponse(
            {"error": "snapshot with inputs and price_and_greeks is required"},
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
        "You are FinanceBud, an options-education assistant inside the FinanceBuddy app. "
        "You receive snapshots of European option pricing runs as JSON and explain them to the user. "
        "The snapshot has two keys: 'inputs' (symbol, side, S, K, r, q, sigma, T, as_of, expiry) "
        "and 'price_and_greeks' (fair_value, delta, gamma, theta, vega, rho). "
        "Explain what the fair value and each Greek mean in practical terms for the trader, "
        "including how they relate to price moves, volatility, time decay, and interest rates. "
        "Keep answers concise and structured with short paragraphs or bullet points."
    )

    snapshot_text = json.dumps(snapshot, separators=(",", ":"), ensure_ascii=False)

    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {
            "role": "system",
            "content": f"Here is the latest European option snapshot as JSON: {snapshot_text}",
        },
    ]
    messages.extend(user_messages)

    try:
        resp = client.responses.create(
            model=os.getenv("OPENAI_ASSISTANT_MODEL", "gpt-5-nano"),
            input=messages,
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

    return JsonResponse({"reply": reply_text})
