"""Explainability Agent — LLM narrates computed outputs as Decision Cards."""
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


LANG_DIRECTIVES = {
    "hi": "MANDATORY LANGUAGE: You MUST write every 'action', 'why', and 'if_ignored' strictly in HINDI (हिन्दी) in Devanagari script. Do not use English for explanations.",
    "mr": "MANDATORY LANGUAGE: You MUST write every 'action', 'why', and 'if_ignored' strictly in MARATHI (मराठी) in Devanagari script. Do not use English for explanations.",
    "bn": "MANDATORY LANGUAGE: You MUST write every 'action', 'why', and 'if_ignored' strictly in BENGALI (বাংলা) in Bengali script. Do not use English for explanations.",
    "pa": "MANDATORY LANGUAGE: You MUST write every 'action', 'why', and 'if_ignored' strictly in PUNJABI (ਪੰਜਾਬੀ) in Gurmukhi script. Do not use English for explanations.",
    "en": "Output in simple, clear English."
}

FALLBACK_CARDS = {
    "hi": [
        {
            "action": "सबसे पहले आपातकालीन फंड (Emergency Fund) बनाएं",
            "why": "3 से 6 महीने के खर्चों के बराबर आपातकालीन कोष आपको किसी भी संकट में महंगे कर्जों से सुरक्षित रखता है।",
            "if_ignored": "बचत के बिना कोई भी अचानक चिकित्सीय या पारिवारिक खर्च आपको भारी ब्याज वाले कर्ज में धकेल सकता है।",
            "priority": 1,
        },
        {
            "action": "सरकारी सुरक्षा योजनाओं (PMSBY व PMJJBY) में तुरंत नामांकन करें",
            "why": "मात्र ₹20 और ₹436 सालाना प्रीमियम में ₹4 लाख का जीवन व दुर्घटना सुरक्षा कवच आपके परिवार को मिलता है।",
            "if_ignored": "बिना बीमा अप्रत्याशित संकट आने पर परिवार को भारी आर्थिक आघात झेलना पड़ सकता है।",
            "priority": 2,
        },
        {
            "action": "मासिक अधिशेष से बचत को अनुशासित करें",
            "why": "हर महीने की अतिरिक्त बचत को ऑटो-डेबिट के जरिए सुरक्षित रखने से वित्तीय भविष्य मजबूत होता है।",
            "if_ignored": "अनियोजित खर्चों में अधिशेष समाप्त हो सकता है और दीर्घकालिक लक्ष्य छूट सकते हैं।",
            "priority": 3,
        }
    ],
    "mr": [
        {
            "action": "सर्वप्रथम आणीबाणी निधी (Emergency Fund) तयार करा",
            "why": "३ ते ६ महिन्यांच्या खर्चाचा निधी संकटकाळात कर्जबाजारी होण्यापासून वाचवतो.",
            "if_ignored": "बचत नसल्यास अचानक आलेला वैद्यकीय खर्च आपल्याला चढ्या व्याजाच्या कर्जात ढकलू शकतो.",
            "priority": 1,
        },
        {
            "action": "PMSBY व PMJJBY विमा योजनांमध्ये नावनोंदणी करा",
            "why": "अत्यल्प वार्षिक शुल्कात ₹४ लाखांचे सुरक्षा कवच कुटुंबाचे भविष्य सुरक्षित करते.",
            "if_ignored": "विमा नसल्यास आपत्कालीन परिस्थितीत कुटुंबावर गंभीर आर्थिक ताण येऊ शकतो.",
            "priority": 2,
        }
    ],
    "bn": [
        {
            "action": "প্রথমে জরুরি তহবিল (Emergency Fund) তৈরি করুন",
            "why": "৩ থেকে ৬ মাসের খরচের সমান সঞ্চয় যেকোনো সংকটে উচ্চ সুদের ঋণ থেকে সুরক্ষা দেয়।",
            "if_ignored": "সঞ্চয় না থাকলে আকস্মিক বিপদে পরিবার ঋণের জালে জড়িয়ে পড়তে পারে।",
            "priority": 1,
        },
        {
            "action": "PMSBY এবং PMJJBY বীমা যোজনায় নথিভুক্ত করুন",
            "why": "নামমাত্র বার্ষিক প্রিমিয়ামে ৪ লাখ টাকার জীবন ও দুর্ঘটনা বীমা কভারেজ পাওয়া যায়।",
            "if_ignored": "বীমা না থাকলে অপ্রত্যাশিত বিপদে পরিবার আর্থিক সংকটে পড়বে।",
            "priority": 2,
        }
    ],
    "pa": [
        {
            "action": "ਪਹਿਲਾਂ ਐਮਰਜੈਂਸੀ ਫੰਡ (Emergency Fund) ਤਿਆਰ ਕਰੋ",
            "why": "3 ਤੋਂ 6 ਮਹੀਨਿਆਂ ਦੇ ਖਰਚਿਆਂ ਜਿੰਨੀ ਬਚਤ ਔਖੇ ਵੇਲੇ ਕਰਜ਼ੇ ਦੇ ਜਾਲ ਤੋਂ ਬਚਾਉਂਦੀ ਹੈ।",
            "if_ignored": "ਬਚਤ ਤੋਂ ਬਿਨਾਂ ਅਚਾਨਕ ਖਰਚੇ ਪਰਿਵਾਰ ਨੂੰ ਭਾਰੀ ਕਰਜ਼ੇ ਵਿੱਚ ਧੱਕ ਸਕਦੇ ਹਨ।",
            "priority": 1,
        },
        {
            "action": "PMSBY ਅਤੇ PMJJBY ਸਰਕਾਰੀ ਬੀਮਾ ਯੋਜਨਾਵਾਂ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ",
            "why": "ਮਾਮੂਲੀ ਸਲਾਨਾ ਪ੍ਰੀਮੀਅਮ 'ਤੇ ₹4 ਲੱਖ ਦਾ ਜੀਵਨ ਅਤੇ ਹਾਦਸਾ ਕਵਰੇਜ ਮਿਲਦਾ ਹੈ।",
            "if_ignored": "ਬੀਮੇ ਤੋਂ ਬਿਨਾਂ ਅਣਕਿਆਸੇ ਸੰਕਟ ਵੇਲੇ ਪਰਿਵਾਰ ਨੂੰ ਭਾਰੀ ਧੱਕਾ ਲੱਗ ਸਕਦਾ ਹੈ।",
            "priority": 2,
        }
    ],
    "en": [
        {
            "action": "Build your emergency fund first",
            "why": "An emergency fund of 3–6 months of expenses protects you from needing predatory loans during a crisis.",
            "if_ignored": "Without savings, one medical or job emergency forces you into high-interest debt.",
            "priority": 1,
        },
        {
            "action": "Enroll in PMSBY and PMJJBY government schemes",
            "why": "Low-cost government insurance provides essential ₹4 lakh life and accident protection.",
            "if_ignored": "Without insurance, an unexpected shock can deplete family savings.",
            "priority": 2,
        }
    ]
}


async def run_explainability(state: ArthSaathiState) -> list[dict]:
    p       = state.get("profile", {})
    m       = state.get("financial_metrics", {})
    lang    = p.get("preferredLang", "en")
    schemes = [s["name"] for s in state.get("eligible_schemes", []) if s.get("eligible")]

    lang_note = LANG_DIRECTIVES.get(lang, LANG_DIRECTIVES["en"])
    user_prompt = f"{PROMPT}\n\n{lang_note}".format(
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
                            {"role": "system", "content": f"You are FinMate's Explainability Agent. Output strictly a valid JSON array. {lang_note}"},
                            {"role": "user", "content": user_prompt},
                        ],
                        temperature=0.2,
                        max_tokens=650,
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
            response = await llm.ainvoke([HumanMessage(content=user_prompt)])
            cards = json.loads(_clean_json(response.content))
            state.setdefault("fallback_flags", {})["explainability"] = False
            return cards if isinstance(cards, list) else []
        except Exception as e:
            logger.warning(f"[Explainability] Gemini fallback failed: {e}")

    # 3. Localized deterministic fallback
    logger.info(f"[Explainability] Using localized fallback cards for lang={lang}")
    state.setdefault("fallback_flags", {})["explainability"] = True
    return FALLBACK_CARDS.get(lang, FALLBACK_CARDS["en"])
