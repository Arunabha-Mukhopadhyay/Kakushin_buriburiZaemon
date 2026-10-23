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
    "hi": "MANDATORY LANGUAGE: You MUST write your ENTIRE summary in fluent, natural Hindi (हिंदी) using Devanagari script only. Do NOT use English. Keep financial terms clear and conversational.",
    "en": "Respond in simple, clear, empathetic English. Short sentences. Avoid jargon.",
    "mr": "MANDATORY LANGUAGE: You MUST write your ENTIRE summary in fluent, natural Marathi (मराठी) using Devanagari script only. Do NOT use English.",
    "kn": "MANDATORY LANGUAGE: You MUST write your ENTIRE summary in fluent, natural Kannada (ಕನ್ನಡ) script only. Do NOT use English.",
    "bn": "MANDATORY LANGUAGE: You MUST write your ENTIRE summary in fluent, natural Bengali (বাংলা) using Bengali script only. Do NOT use English.",
    "pa": "MANDATORY LANGUAGE: You MUST write your ENTIRE summary in fluent, natural Punjabi (ਪੰਜਾਬੀ) using Gurmukhi script only. Do NOT use English.",
}

PROMPT = """You are FinMate, a warm and trusted financial companion for everyday Indians.

{lang_instruction}

Summarise the following analysis for the user in a friendly, conversational tone (as if speaking to them directly in the requested language).
Keep it under 150 words. Voice-friendly — no bullet points, no markdown, no headers.

Risk level: {risk_category} risk (score {risk_score}/100)
Monthly surplus: ₹{surplus}
Emergency fund: {emergency_months} months covered
Top recommendation: {top_card}
Top action: {top_action}
Eligible schemes: {schemes}
Scam alert: {scam_alert}

End with one encouraging sentence in the requested language.
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

    lang_directive = LANG_INSTRUCTIONS.get(lang, LANG_INSTRUCTIONS["en"])

    filled = PROMPT.format(
        lang_instruction=lang_directive,
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
            client = Groq(api_key=key, timeout=8.0)
            candidate_models = ["qwen/qwen3.8-27b", GROQ_MODEL, "openai/gpt-oss-120b"]
            for model in candidate_models:
                try:
                    response = client.chat.completions.create(
                        model=model,
                        messages=[
                            {
                                "role": "system",
                                "content": (
                                    f"You are FinMate, a warm and empathetic financial advisor for everyday Indians. "
                                    f"{lang_directive}"
                                ),
                            },
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
        from langchain_core.messages import HumanMessage, SystemMessage

        MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
        llm = ChatGoogleGenerativeAI(
            model=MODEL_NAME,
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.4,
        )
        response = await llm.ainvoke([
            SystemMessage(content=f"You are FinMate. {lang_directive}"),
            HumanMessage(content=filled)
        ])
        state.setdefault("fallback_flags", {})["accessibility"] = False
        return response.content.strip()
    except Exception as e:
        logger.warning(f"[Accessibility] Gemini call also failed ({e}). Using deterministic fallback.")

    # Deterministic multilingual fallback with actual user data
    state.setdefault("fallback_flags", {})["accessibility"] = True
    surplus = round(float(m.get("monthly_surplus", 0)))
    runway = round(float(m.get("emergency_months", 0)), 1)
    risk_cat = state.get("risk_category", "unknown")
    risk_sc = state.get("risk_score", 0)

    if lang == "hi":
        schemes_str = f"आप {', '.join(schemes[:2])} जैसी सरकारी योजनाओं के भी पात्र हैं। " if schemes else ""
        return (
            f"आपकी वित्तीय प्रोफ़ाइल के अनुसार, आपके पास हर महीने ₹{surplus:,} का अधिशेष (सरप्लस) बचता है "
            f"और आपका आपातकालीन फंड {runway} महीनों के खर्च के लिए पर्याप्त है। "
            f"आपका वित्तीय स्वास्थ्य स्कोर {risk_sc}/100 है ({risk_cat} जोखिम)। "
            f"आपकी शीर्ष प्राथमिकता होनी चाहिए: {top_card}। "
            f"{schemes_str}"
            f"शुरुआत {top_action} से करें — वित्तीय सुरक्षा की ओर उठाया गया हर छोटा कदम महत्वपूर्ण है!"
        )

    if lang == "mr":
        schemes_str = f"तुम्ही {', '.join(schemes[:2])} सारख्या सरकारी योजनांसाठी पात्र आहात. " if schemes else ""
        return (
            f"तुमच्या आर्थिक प्रोफाइलनुसार, तुमच्याकडे दरमहा ₹{surplus:,} इतका सरप्लस शिल्लक राहतो "
            f"आणि तुमचा आपत्कालीन निधी {runway} महिन्यांच्या खर्चासाठी पुरेसा आहे. "
            f"तुमचा आरोग्य स्कोर {risk_sc}/100 आहे. "
            f"तुमचे पहिले पाऊल असावे: {top_card}. "
            f"{schemes_str}"
            f"{top_action} ने सुरुवात करा — आर्थिक सुरक्षेसाठी घेतलेले प्रत्येक पाऊल महत्त्वाचे आहे!"
        )

    if lang == "bn":
        schemes_str = f"আপনি {', '.join(schemes[:2])} প্রকল্পের জন্যও যোগ্য। " if schemes else ""
        return (
            f"আপনার আর্থিক প্রোফাইল পর্যালোচনা অনুযায়ী, আপনার প্রতি মাসে ₹{surplus:,} উদ্বৃত্ত থাকে "
            f"এবং আপনার জরুরি তহবিল {runway} মাসের খরচ মেটাতে সক্ষম। "
            f"আপনার আর্থিক স্বাস্থ্য স্কোর {risk_sc}/100। "
            f"আপনার প্রথম অগ্রাধিকার হওয়া উচিত: {top_card}। "
            f"{schemes_str}"
            f"{top_action} দিয়ে শুরু করুন — প্রতিটি ছোট পদক্ষেপ আপনার ভবিষ্যৎ সুরক্ষিত করে!"
        )

    if lang == "pa":
        schemes_str = f"ਤੁਸੀਂ {', '.join(schemes[:2])} ਵਰਗੀਆਂ ਸਰਕਾਰੀ ਸਕੀਮਾਂ ਲਈ ਵੀ ਯੋਗ ਹੋ। " if schemes else ""
        return (
            f"ਤੁਹਾਡੀ ਵਿੱਤੀ ਪ੍ਰੋਫਾਈਲ ਅਨੁਸਾਰ, ਤੁਹਾਡੇ ਕੋਲ ਹਰ ਮਹੀਨੇ ₹{surplus:,} ਵਾਧੂ ਬਚਤ ਬਚਦੀ ਹੈ "
            f"ਅਤੇ ਤੁਹਾਡਾ ਐਮਰਜੈਂਸੀ ਫੰਡ {runway} ਮਹੀਨਿਆਂ ਦੇ ਖਰਚੇ ਲਈ ਕਾਫੀ ਹੈ। "
            f"ਤੁਹਾਡਾ ਵਿੱਤੀ ਸਕੋਰ {risk_sc}/100 ਹੈ। "
            f"ਤੁਹਾਡੀ ਸਭ ਤੋਂ ਵੱਡੀ ਤਰਜੀਹ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ: {top_card}। "
            f"{schemes_str}"
            f"{top_action} ਨਾਲ ਸ਼ੁਰੂਆਤ ਕਰੋ — ਹਰ ਛੋਟਾ ਕਦਮ ਵਿੱਤੀ ਸੁਰੱਖਿਆ ਵੱਲ ਵੱਡੀ ਕਾਮਯਾਬੀ ਹੈ!"
        )

    return (
        f"Based on your financial profile, you have a monthly surplus of {_inr(surplus)} "
        f"and your emergency runway covers {runway} months of expenses. "
        f"Your financial health score is {risk_sc}/100 ({risk_cat} risk). "
        f"Your top priority should be: {top_card.lower()}. "
        f"{'You are eligible for: ' + ', '.join(schemes[:2]) + '. ' if schemes else ''}"
        f"Start with {top_action.lower()} — every small step counts toward financial security!"
    )
