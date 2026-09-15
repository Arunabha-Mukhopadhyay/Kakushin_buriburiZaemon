"""Accessibility Agent — adapts final response to user's language and reading level."""
from __future__ import annotations
import os
from state import ArthSaathiState
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.4,
)

LANG_INSTRUCTIONS = {
    "hi": "Respond in simple Hindi (Hinglish is fine). Use short sentences. Avoid formal Sanskrit words.",
    "en": "Respond in simple English. Short sentences. Avoid jargon.",
    "mr": "Respond in simple Marathi. Use everyday words.",
    "kn": "Respond in simple Kannada. Use everyday words.",
}

PROMPT = """
You are ArthSaathi, a warm and trusted financial companion for everyday Indians.

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

    try:
        response = await llm.ainvoke([HumanMessage(content=filled)])
        return response.content.strip()
    except Exception:
        return (
            "Namaste! Based on your profile, your top priority is building an emergency fund. "
            "Start by saving a small amount daily. You are doing the right thing by planning ahead!"
        )
