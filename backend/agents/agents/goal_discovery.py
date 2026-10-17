import json, os, logging
from dotenv import load_dotenv
from state import ArthSaathiState

load_dotenv()
logger = logging.getLogger(__name__)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

PROMPT = """
You are a financial goal extraction assistant for FinMate, an Indian financial companion.

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
                            {"role": "system", "content": "You are a financial goal extractor that outputs strictly valid JSON arrays."},
                            {"role": "user", "content": filled},
                        ],
                        temperature=0.2,
                        max_tokens=600,
                    )
                    msg_obj = response.choices[0].message
                    content = msg_obj.content or getattr(msg_obj, "reasoning", "") or ""
                    goals = json.loads(_clean_json(content))
                    if isinstance(goals, list) and len(goals) > 0:
                        return goals
                except Exception:
                    continue
        except Exception as e:
            logger.warning(f"[GoalDiscovery] Groq failed: {e}")

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
                temperature=0.2,
            )
            response = await llm.ainvoke([HumanMessage(content=filled)])
            goals = json.loads(_clean_json(response.content))
            return goals if isinstance(goals, list) else []
        except Exception as e:
            logger.warning(f"[GoalDiscovery] Gemini fallback failed: {e}")

    expenses = float(p.get("monthlyExpenses", 0) or 0)
    return [
        {"title": "Emergency Fund", "target_amount": round(expenses * 6), "horizon_months": 12, "priority": 1},
        {"title": "Basic Insurance Cover", "target_amount": None, "horizon_months": 1, "priority": 2},
    ]
