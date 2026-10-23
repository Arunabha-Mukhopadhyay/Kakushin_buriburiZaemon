"""Coach Agent — LLM generates a prioritised daily action plan."""
from __future__ import annotations
import json, os, logging
from dotenv import load_dotenv
from state import ArthSaathiState

load_dotenv()
logger = logging.getLogger(__name__)

from config import get_groq_api_key, get_groq_model

GROQ_API_KEY = get_groq_api_key()
GROQ_MODEL = get_groq_model()

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


COACH_LANG_DIRECTIVES = {
    "hi": "MANDATORY LANGUAGE: You MUST write the JSON response strictly in HINDI (हिन्दी) in Devanagari script for 'task' and 'deadline'. Do not output in English.",
    "mr": "MANDATORY LANGUAGE: You MUST write the JSON response strictly in MARATHI (मराठी) in Devanagari script for 'task' and 'deadline'. Do not output in English.",
    "bn": "MANDATORY LANGUAGE: You MUST write the JSON response strictly in BENGALI (বাংলা) in Bengali script for 'task' and 'deadline'. Do not output in English.",
    "pa": "MANDATORY LANGUAGE: You MUST write the JSON response strictly in PUNJABI (ਪੰਜਾਬੀ) in Gurmukhi script for 'task' and 'deadline'. Do not output in English.",
    "en": "Output in simple, clear English."
}


async def run_coach(state: ArthSaathiState) -> list[dict]:
    p       = state["profile"]
    m       = state.get("financial_metrics", {})
    goals   = state.get("goals", [])
    schemes = [s["name"] for s in state.get("eligible_schemes", []) if s.get("eligible")]
    scams   = len(state.get("scam_flags", []))
    lang    = p.get("preferredLang", "en")

    top_goal = goals[0]["title"] if goals else "Build emergency fund"
    surplus  = float(m.get("monthly_surplus", 0))

    lang_note = COACH_LANG_DIRECTIVES.get(lang, COACH_LANG_DIRECTIVES["en"])
    user_prompt = f"{PROMPT}\n\n{lang_note}".format(
        income=p.get("monthlyIncome", 0),
        surplus=round(surplus, 0),
        risk_category=state.get("risk_category", "unknown"),
        top_goal=top_goal,
        schemes=", ".join(schemes[:3]) if schemes else "None",
        scam_count=scams,
    )

    # 1. Try Groq first
    key = get_groq_api_key()
    if key:
        try:
            from groq import Groq
            client = Groq(api_key=key)
            candidate_models = ["qwen/qwen3.8-27b", GROQ_MODEL, "openai/gpt-oss-20b"]
            for model in candidate_models:
                try:
                    response = client.chat.completions.create(
                        model=model,
                        messages=[
                            {"role": "system", "content": f"You are a behavioral finance coach that outputs strictly valid JSON arrays. {lang_note}"},
                            {"role": "user", "content": user_prompt},
                        ],
                        temperature=0.3,
                        max_tokens=650,
                    )
                    msg_obj = response.choices[0].message
                    content = msg_obj.content or getattr(msg_obj, "reasoning", "") or ""
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
            response = await llm.ainvoke([HumanMessage(content=user_prompt)])
            plan = json.loads(_clean_json(response.content))
            state.setdefault("fallback_flags", {})["coach"] = False
            return plan if isinstance(plan, list) else []
        except Exception as e:
            logger.warning(f"[Coach] Gemini fallback failed: {e}")

    # 3. Localized deterministic fallback
    logger.info(f"[Coach] Using localized fallback plan for lang={lang}")
    state.setdefault("fallback_flags", {})["coach"] = True
    daily = max(round(surplus / 30 * 0.3), 50) if surplus > 0 else 50

    fallback_plans = {
        "hi": [
            {"task": f"आज ही अपने बैंक खाते में ₹{daily} सुरक्षित करें", "daily_amount": daily, "deadline": "आज ही", "scheme": None},
            {"task": "बैंक शाखा या ऐप से पीएम सुरक्षा व जीवन ज्योति बीमा का फॉर्म भरें", "daily_amount": None, "deadline": "इस सप्ताह", "scheme": "PMSBY/PMJJBY"},
            {"task": "सभी अनौपचारिक कर्ज और ब्याज दरों की सूची बनाकर पुनर्समीक्षा करें", "daily_amount": None, "deadline": "14 दिनों के भीतर", "scheme": None},
        ],
        "mr": [
            {"task": f"आजच आपल्या बँक खात्यात ₹{daily} सुरक्षित ठेवा", "daily_amount": daily, "deadline": "आजच", "scheme": None},
            {"task": "बँक किंवा ॲपद्वारे PMSBY आणि PMJJBY विम्यासाठी नोंदणी करा", "daily_amount": None, "deadline": "या आठवड्यात", "scheme": "PMSBY/PMJJBY"},
            {"task": "सर्व कर्जांची आणि व्याजाच्या दरांची यादी तपासा", "daily_amount": None, "deadline": "१४ दिवसांत", "scheme": None},
        ],
        "bn": [
            {"task": f"আজই আপনার ব্যাঙ্ক অ্যাকাউন্টে ₹{daily} জমা রাখুন", "daily_amount": daily, "deadline": "আজই", "scheme": None},
            {"task": "ব্যাঙ্কে গিয়ে PMSBY ও PMJJBY বীমা নিশ্চিত করুন", "daily_amount": None, "deadline": "এই সপ্তাহে", "scheme": "PMSBY/PMJJBY"},
            {"task": "সমস্ত ঋণ এবং সুদের হারের তালিকা তৈরি করুন", "daily_amount": None, "deadline": "১৪ দিনের মধ্যে", "scheme": None},
        ],
        "pa": [
            {"task": f"ਅੱਜ ਹੀ ਆਪਣੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ₹{daily} ਬਚਾਓ", "daily_amount": daily, "deadline": "ਅੱਜ ਹੀ", "scheme": None},
            {"task": "ਆਪਣੇ ਬੈਂਕ ਤੋਂ PMSBY ਅਤੇ PMJJBY ਬੀਮੇ ਲਈ ਫਾਰਮ ਭਰੋ", "daily_amount": None, "deadline": "ਇਸ ਹਫ਼ਤੇ", "scheme": "PMSBY/PMJJBY"},
            {"task": "ਸਾਰੇ ਕਰਜ਼ਿਆਂ ਅਤੇ ਵਿਆਜ ਦਰਾਂ ਦੀ ਸੂਚੀ ਤਿਆਰ ਕਰੋ", "daily_amount": None, "deadline": "14 ਦਿਨਾਂ ਦੇ ਅੰਦਰ", "scheme": None},
        ],
        "en": [
            {"task": f"Save ₹{daily} today in your bank account", "daily_amount": daily, "deadline": "Today", "scheme": None},
            {"task": "Check eligibility for PMJJBY/PMSBY insurance at your bank", "daily_amount": None, "deadline": "This week", "scheme": "PMJJBY"},
            {"task": "Review and list all informal loans and interest rates", "daily_amount": None, "deadline": "Within 14 days", "scheme": None},
        ]
    }
    return fallback_plans.get(lang, fallback_plans["en"])
