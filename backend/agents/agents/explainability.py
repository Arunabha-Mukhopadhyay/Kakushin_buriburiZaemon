"""Explainability Agent — LLM narrates computed outputs as Decision Cards."""
from __future__ import annotations
import json, os, logging
from dotenv import load_dotenv
from state import ArthSaathiState

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

PROMPT = """
You are FinMate's Explainability Agent. You explain financial analysis results in simple, warm, human language.

RULE: Never invent numbers. Only narrate the data provided below.
Do not describe the user as having zero/no debt unless the existing debt balance is ₹0. A zero DTI means no monthly EMI was reported; it does not mean the user has no outstanding debt.
The credibility score measures input consistency only; it does not verify the user's identity, prove the inputs are true, or measure overall financial health.

Financial snapshot:
- Monthly surplus: ₹{surplus}
- Existing debt balance: ₹{total_debt}
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


async def run_explainability(state: ArthSaathiState) -> list[dict]:
    m       = state.get("financial_metrics", {})
    schemes = [s["name"] for s in state.get("eligible_schemes", []) if s.get("eligible")]

    filled = PROMPT.format(
        surplus=round(float(m.get("monthly_surplus", 0)), 0),
        total_debt=round(float(m.get("total_debt", 0)), 0),
        dti=round(float(m.get("dti_ratio", 0)) * 100, 1),
        emergency_months=round(float(m.get("emergency_months", 0)), 1),
        risk_score=state.get("risk_score", 0),
        risk_category=state.get("risk_category", "unknown"),
        credibility_score=state.get("credibility_score", 0),
        schemes=", ".join(schemes) if schemes else "None identified",
    )

    # 1. Try Groq first
    if GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            candidate_models = ["qwen/qwen3.8-27b", GROQ_MODEL, "openai/gpt-oss-20b"]
            for model in candidate_models:
                try:
                    response = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": "You are a financial advisor assistant that outputs strictly valid JSON."},
                            {"role": "user", "content": filled},
                        ],
                        temperature=0.2,
                        max_tokens=600,
                    )
                    msg_obj = response.choices[0].message
                    content = msg_obj.content or getattr(msg_obj, "reasoning", "") or ""
                    cards = json.loads(_clean_json(content))
                    if isinstance(cards, list) and len(cards) > 0:
                        state.setdefault("fallback_flags", {})["explainability"] = False
                        return cards
                except Exception:
                    continue
        except Exception as e:
            logger.warning(f"[Explainability] Groq failed: {e}")

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
            cards = json.loads(_clean_json(response.content))
            state.setdefault("fallback_flags", {})["explainability"] = False
            return cards if isinstance(cards, list) else []
        except Exception as e:
            logger.warning(f"[Explainability] Gemini fallback failed: {e}")

    # 3. Deterministic fallback
    logger.info("[Explainability] Using deterministic fallback cards.")
    state.setdefault("fallback_flags", {})["explainability"] = True
    return [{
        "action":     "Build your emergency fund first",
        "why":        "An emergency fund of 3–6 months of expenses protects you from needing predatory loans during a crisis.",
        "if_ignored": "Without savings, one medical or job emergency forces you into high-interest debt.",
        "priority":   1,
    }]
