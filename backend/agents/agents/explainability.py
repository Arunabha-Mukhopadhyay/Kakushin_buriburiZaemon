"""Explainability Agent — LLM narrates computed outputs as Decision Cards."""
from __future__ import annotations
import json, os
from state import ArthSaathiState
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.3,
)

PROMPT = """
You are ArthSaathi's Explainability Agent. You explain financial analysis results in simple, warm, human language.

RULE: Never invent numbers. Only narrate the data provided below.

Financial snapshot:
- Monthly surplus: ₹{surplus}
- DTI ratio: {dti}
- Emergency fund: {emergency_months} months
- Risk score: {risk_score}/100 ({risk_category} risk)
- Credibility score: {credibility_score}/100
- Eligible schemes: {schemes}

Create 3 Decision Cards as a JSON array. Each card:
{{
  "action": "What to do (short, specific)",
  "why": "Why this matters (1–2 sentences, simple language)",
  "if_ignored": "Consequence of not acting (1 sentence)",
  "priority": 1
}}

Order by priority (most urgent first).
Return ONLY valid JSON array.
"""

async def run_explainability(state: ArthSaathiState) -> list[dict]:
    m       = state.get("financial_metrics", {})
    schemes = [s["name"] for s in state.get("eligible_schemes", []) if s.get("eligible")]

    filled = PROMPT.format(
        surplus=round(float(m.get("monthly_surplus", 0)), 0),
        dti=round(float(m.get("dti_ratio", 0)) * 100, 1),
        emergency_months=round(float(m.get("emergency_months", 0)), 1),
        risk_score=state.get("risk_score", 0),
        risk_category=state.get("risk_category", "unknown"),
        credibility_score=state.get("credibility_score", 0),
        schemes=", ".join(schemes) if schemes else "None identified",
    )

    try:
        response = await llm.ainvoke([HumanMessage(content=filled)])
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        cards = json.loads(text.strip())
        return cards if isinstance(cards, list) else []
    except Exception:
        return [{
            "action":     "Build your emergency fund first",
            "why":        "An emergency fund of 3–6 months of expenses protects you from needing predatory loans during a crisis.",
            "if_ignored": "Without savings, one medical or job emergency forces you into high-interest debt.",
            "priority":   1,
        }]
