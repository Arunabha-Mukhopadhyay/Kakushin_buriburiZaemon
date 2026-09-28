"""Scam Detection Agent — FAISS semantic search on scam_patterns store."""
from __future__ import annotations
from state import ArthSaathiState

SCAM_TYPE_MAP = {
    "digital arrest": "digital_arrest",
    "kyc": "fake_kyc",
    "lottery": "lottery_scam",
    "won": "lottery_scam",
    "claim": "lottery_scam",
    "pay": "advance_fee_fraud",
    "guaranteed return": "investment_doubling",
    "double": "investment_doubling",
    "loan app": "predatory_loan_app",
    "otp": "otp_fraud",
    "whatsapp": "social_engineering",
    "job offer": "fake_job",
    "prize": "lottery_scam",
    "rbi": "authority_impersonation",
    "cbi": "authority_impersonation",
    "police": "authority_impersonation",
}

# High-confidence keyword combos that ALWAYS fire regardless of FAISS score
HARD_SCAM_PATTERNS = [
    (["lottery", "pay"],          "lottery_scam",        "Lottery + upfront payment is a classic advance-fee fraud."),
    (["won", "pay"],              "lottery_scam",        "Lottery + upfront payment is a classic advance-fee fraud."),
    (["prize", "pay"],            "lottery_scam",        "Prize + upfront payment is a classic advance-fee fraud."),
    (["won", "claim"],            "lottery_scam",        "Lottery + upfront payment is a classic advance-fee fraud."),
    (["digital", "arrest"],       "digital_arrest",      "Digital arrest is a known impersonation scam by fake police/CBI officers."),
    (["otp", "share"],            "otp_fraud",           "Never share your OTP with anyone — banks never ask for it."),
    (["guaranteed", "return"],    "investment_doubling",  "Guaranteed returns are a hallmark of Ponzi/investment fraud."),
    (["kyc", "expire"],           "fake_kyc",            "KYC expiry threats are a known phishing tactic."),
    (["loan", "app", "contact"],  "predatory_loan_app",  "Predatory loan apps misuse contacts and photos — uninstall immediately."),
]


async def run_scam_detection(state: ArthSaathiState) -> list[dict]:
    suspicious = state.get("suspicious_input") or state.get("user_message", "")
    if not suspicious or len(suspicious.strip()) < 5:
        return []

    text_lower = suspicious.lower()

    # --- Hard keyword match (always fires, FAISS not required) ---
    for keywords, scam_type, specific_warning in HARD_SCAM_PATTERNS:
        if all(kw in text_lower for kw in keywords):
            return [{
                "pattern":    suspicious[:200],
                "source":     "keyword_rule",
                "score":      0.0,
                "scam_type":  scam_type,
                "confidence": 0.95,
                "warning":    (
                    f"{specific_warning} "
                    "Do NOT share OTP, pay upfront fees, or click unknown links. "
                    "Call 1930 if you have already lost money."
                ),
            }]

    # --- FAISS semantic search (catches nuanced / paraphrased scams) ---
    try:
        from rag.retriever import query
        results = query(suspicious, store="scam_patterns", top_k=3)
    except FileNotFoundError:
        return []

    scam_type = next(
        (v for k, v in SCAM_TYPE_MAP.items() if k in text_lower),
        "unknown_fraud",
    )

    for r in results:
        if r["score"] < 2.0:
            return [{
                "pattern":    r["text"][:200],
                "source":     r["source"],
                "score":      round(r["score"], 4),
                "scam_type":  scam_type,
                "confidence": round(max(0, 1 - r["score"] / 2.5), 2),
                "warning":    (
                    "This matches a known fraud pattern. "
                    "Do NOT share OTP, pay upfront fees, or click unknown links. "
                    "Call 1930 if you have already lost money."
                ),
            }]

    return []
