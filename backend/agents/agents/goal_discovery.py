"""Goal Discovery Agent — LLM extracts and structures user goals from conversation."""
from __future__ import annotations
import json, os
from state import ArthSaathiState
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0.2,
)

PROMPT = """
You are a financial goal extraction assistant for ArthSaathi, an Indian financial companion.

Given the user's message and financial profile, extract their financial goals.
Return a JSON array of goals. Each goal must have:
- title: string (short goal name in English)
- target_amount: number or null (in INR, null if unknown)
- horizon_months: number or null (time in months, null if unknown)
- priority: number (1=highest priority)

User message: {user_message}
Monthly income: ₹{income}
Employment: {employment}

Return ONLY valid JSON. Example:
[{{"title": "Emergency Fund", "target_amount": 90000, "horizon_months": 12, "priority": 1}}]

If no clear goal is mentioned, return default goals based on their profile:
- Emergency fund (6 months of expenses) as priority 1
- Basic insurance enrollment as priority 2
"""

async def run_goal_discovery(state: ArthSaathiState) -> list[dict]:
    p       = state["profile"]
    message = state.get("user_message", "") or ""

    if not message.strip():
        # Default goals when no message provided
        expenses = float(p.get("monthlyExpenses", 0) or 0)
        return [
            {"title": "Emergency Fund", "target_amount": round(expenses * 6), "horizon_months": 12, "priority": 1},
            {"title": "Accident Insurance (PMSBY)", "target_amount": None, "horizon_months": 1, "priority": 2},
        ]

    filled = PROMPT.format(
        user_message=message,
        income=p.get("monthlyIncome", 0),
        employment=p.get("employmentType", "unknown"),
    )

    try:
        response = await llm.ainvoke([HumanMessage(content=filled)])
        text = response.content.strip()
        # Strip markdown code fences if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        goals = json.loads(text.strip())
        return goals if isinstance(goals, list) else []
    except Exception:
        expenses = float(p.get("monthlyExpenses", 0) or 0)
        return [
            {"title": "Emergency Fund", "target_amount": round(expenses * 6), "horizon_months": 12, "priority": 1},
        ]
