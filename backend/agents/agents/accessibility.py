"""Accessibility Agent — adapts final response to user's language and reading level.

Uses Groq LLM for natural language generation, with a deterministic fallback.
"""
from __future__ import annotations
import os, logging
from dotenv import load_dotenv
from state import ArthSaathiState

load_dotenv()

logger = logging.getLogger(__name__)

from config import get_groq_api_key, get_groq_model

GROQ_API_KEY = get_groq_api_key()
GROQ_MODEL = get_groq_model()

LANG_INSTRUCTIONS = {
    "hi": "Respond in simple Hindi (Hinglish is fine). Use short sentences. Avoid formal Sanskrit words.",
    "en": "Respond in simple English. Short sentences. Avoid jargon.",
    "mr": "Respond in simple Marathi. Use everyday words.",
    "kn": "Respond in simple Kannada. Use everyday words.",
}

PROMPT = """You are FinMate, a warm and trusted financial companion for everyday Indians.

{lang_instruction}

Summarise the following analysis for the user in a friendly, conversational tone (as if speaking to them directly).
Keep it under 150 words. Voice-friendly — no bullet points, no markdown, no headers.

Risk level: {risk_category} risk (score {risk_score}/100)
Monthly surplus: ₹{surplus}
Emergency fund: {emergency_months} months covered
Top recommendation: {top_card}
Top action: {top_action}
Eligible schemes: {schemes}
Scam alert: {scam_alert}

End with one encouraging sentence.
"""


def _inr(value) -> str:
    try:
        return "₹" + f"{round(float(value)):,}"
    except (TypeError, ValueError):
        return "Not available"


async def run_accessibility(state: ArthSaathiState) -> str:
    p       = state["profile"]
    m       = state.get("financial_metrics", {})
    lang    = p.get("preferredLang", "en")
    cards   = state.get("decision_cards", [])
    plan    = state.get("action_plan", [])
    schemes = [s["name"] for s in state.get("eligible_schemes", []) if s.get("eligible")]
    scams   = state.get("scam_flags", [])

    top_card   = cards[0]["action"] if cards else "Build emergency fund"
    top_action = plan[0]["task"] if plan else "Start saving daily"
    scam_alert = scams[0]["warning"][:80] if scams else "No scam flags detected."

    filled = PROMPT.format(
        lang_instruction=LANG_INSTRUCTIONS.get(lang, LANG_INSTRUCTIONS["en"]),
        risk_category=state.get("risk_category", "unknown"),
        risk_score=state.get("risk_score", 0),
        surplus=round(float(m.get("monthly_surplus", 0)), 0),
        emergency_months=round(float(m.get("emergency_months", 0)), 1),
        top_card=top_card,
        top_action=top_action,
        schemes=", ".join(schemes[:3]) if schemes else "None identified",
        scam_alert=scam_alert,
    )

    # Try Groq first
    key = get_groq_api_key()
    if key:
        try:
            from groq import Groq
            client = Groq(api_key=key)
            candidate_models = ["qwen/qwen3.8-27b", GROQ_MODEL, "openai/gpt-oss-120b"]
            for model in candidate_models:
                try:
                    response = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": "You are FinMate, a warm financial advisor for Indians."},
                            {"role": "user", "content": filled},
                        ],
                        temperature=0.5,
                        max_tokens=600,
                    )
                    msg_obj = response.choices[0].message
                    reply = msg_obj.content or getattr(msg_obj, "reasoning", "")
                    if reply and reply.strip():
                        state.setdefault("fallback_flags", {})["accessibility"] = False
                        return reply.strip()
                except Exception:
                    continue
        except Exception as e:
            logger.warning(f"[Accessibility] Groq call failed ({e}). Trying Gemini fallback.")

    # Try Gemini as second fallback
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage

        MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
        llm = ChatGoogleGenerativeAI(
            model=MODEL_NAME,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.4,
        )
        response = await llm.ainvoke([HumanMessage(content=filled)])
        state.setdefault("fallback_flags", {})["accessibility"] = False
        return response.content.strip()
    except Exception as e:
        logger.warning(f"[Accessibility] Gemini call also failed ({e}). Using deterministic fallback.")

    # Deterministic fallback with actual user data
    state.setdefault("fallback_flags", {})["accessibility"] = True
    surplus = round(float(m.get("monthly_surplus", 0)))
    runway = round(float(m.get("emergency_months", 0)), 1)
    risk_cat = state.get("risk_category", "unknown")
    risk_sc = state.get("risk_score", 0)

    return (
        f"Based on your financial profile, you have a monthly surplus of {_inr(surplus)} "
        f"and your emergency runway covers {runway} months of expenses. "
        f"Your financial health score is {risk_sc}/100 ({risk_cat} risk). "
        f"Your top priority should be: {top_card.lower()}. "
        f"{'You are eligible for: ' + ', '.join(schemes[:2]) + '. ' if schemes else ''}"
        f"Start with {top_action.lower()} — every small step counts toward financial security!"
    )
