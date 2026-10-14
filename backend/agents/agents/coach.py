"""Coach Agent — LLM generates a prioritised daily action plan."""
from __future__ import annotations
import json, os, logging
from dotenv import load_dotenv
from state import ArthSaathiState

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

PROMPT = """
You are FinMate's Behavioral Coach. Convert financial recommendations into a concrete, achievable action plan.

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


def _clean_json(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


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

    # 1. Try Groq first
    if GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            candidate_models = [GROQ_MODEL, "qwen/qwen3.8-27b", "openai/gpt-oss-20b"]
            for model in candidate_models:
                try:
                    response = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": "You are a behavioral finance coach that outputs strictly valid JSON arrays."},
                            {"role": "user", "content": filled},
                        ],
                        temperature=0.3,
                        max_tokens=500,
                    )
                    content = response.choices[0].message.content or ""
                    plan = json.loads(_clean_json(content))
                    if isinstance(plan, list) and len(plan) > 0:
                        state.setdefault("fallback_flags", {})["coach"] = False
                        return plan
                except Exception:
                    continue
        except Exception as e:
            logger.warning(f"[Coach] Groq failed: {e}")

    # 2. Try Gemini fallback if key is configured
    google_key = os.getenv("GOOGLE_API_KEY")
    if google_key and not google_key.startswith("your_"):
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            from langchain_core.messages import HumanMessage
            MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
            llm = ChatGoogleGenerativeAI(
                model=MODEL_NAME,
                google_api_key=google_key,
                temperature=0.3,
            )
            response = await llm.ainvoke([HumanMessage(content=filled)])
            plan = json.loads(_clean_json(response.content))
            state.setdefault("fallback_flags", {})["coach"] = False
            return plan if isinstance(plan, list) else []
        except Exception as e:
            logger.warning(f"[Coach] Gemini fallback failed: {e}")

    # 3. Deterministic fallback
    logger.info("[Coach] Using deterministic fallback plan.")
    state.setdefault("fallback_flags", {})["coach"] = True
    daily = max(round(surplus / 30 * 0.3), 50) if surplus > 0 else 50
    return [
        {"task": f"Save ₹{daily} today in your bank account", "daily_amount": daily, "deadline": "Today", "scheme": None},
        {"task": "Check eligibility for PMJJBY insurance at your bank", "daily_amount": None, "deadline": "This week", "scheme": "PMJJBY"},
        {"task": "Review and list all informal loans and interest rates", "daily_amount": None, "deadline": "Within 14 days", "scheme": None},
    ]
