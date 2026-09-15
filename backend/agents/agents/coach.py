"""Coach Agent — LLM generates a prioritised daily action plan."""
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
You are ArthSaathi's Behavioral Coach. Convert financial recommendations into a concrete, achievable action plan.

Profile:
- Monthly income: ₹{income}
- Monthly surplus: ₹{surplus}
- Risk category: {risk_category}
- Top goal: {top_goal}
- Eligible schemes: {schemes}
- Scam alerts: {scam_count} detected

Create an action plan as a JSON array of 3–5 tasks. Each task:
{{
  "task": "Specific action (e.g. 'Save ₹140 today in your savings account')",
  "daily_amount": number or null (INR per day if applicable),
  "deadline": "string or null (e.g. 'This week', 'Within 30 days')",
  "scheme": "scheme name if this task is about enrolling in a scheme, else null"
}}

Make tasks very specific and achievable. Use small amounts. Return ONLY valid JSON array.
"""

async def run_coach(state: ArthSaathiState) -> list[dict]:
    p       = state["profile"]
    m       = state.get("financial_metrics", {})
    goals   = state.get("goals", [])
    schemes = [s["name"] for s in state.get("eligible_schemes", []) if s.get("eligible")]
    scams   = len(state.get("scam_flags", []))

    top_goal = goals[0]["title"] if goals else "Build emergency fund"
    surplus  = float(m.get("monthly_surplus", 0))

    filled = PROMPT.format(
        income=p.get("monthlyIncome", 0),
        surplus=round(surplus, 0),
        risk_category=state.get("risk_category", "unknown"),
        top_goal=top_goal,
        schemes=", ".join(schemes[:3]) if schemes else "None",
        scam_count=scams,
    )

    try:
        response = await llm.ainvoke([HumanMessage(content=filled)])
        text = response.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        plan = json.loads(text.strip())
        return plan if isinstance(plan, list) else []
    except Exception:
        daily = round(max(0, surplus) / 30, 0)
        return [{"task": f"Save ₹{daily} today", "daily_amount": daily, "deadline": "Daily", "scheme": None}]
