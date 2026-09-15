"""Scam Detection Agent — FAISS semantic search on scam_patterns store."""
from __future__ import annotations
from state import ArthSaathiState

SCAM_TYPE_MAP = {
    "digital arrest": "digital_arrest",
    "kyc": "fake_kyc",
    "lottery": "lottery_scam",
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

async def run_scam_detection(state: ArthSaathiState) -> list[dict]:
    suspicious = state.get("suspicious_input") or state.get("user_message", "")
    if not suspicious or len(suspicious.strip()) < 5:
        return []

    try:
        from rag.retriever import query
        results = query(suspicious, store="scam_patterns", top_k=3)
    except FileNotFoundError:
        # FAISS index not built yet — return empty, don't crash
        return []

    flags = []
    for r in results:
        # L2 distance < 1.5 = semantically close = likely match
        if r["score"] < 1.5:
            text_lower = suspicious.lower()
            scam_type  = next(
                (v for k, v in SCAM_TYPE_MAP.items() if k in text_lower),
                "unknown_fraud",
            )
            flags.append({
                "pattern":    r["text"][:200],
                "source":     r["source"],
                "score":      round(r["score"], 4),
                "scam_type":  scam_type,
                "confidence": round(max(0, 1 - r["score"] / 2), 2),
                "warning":    (
                    "This matches a known fraud pattern. "
                    "Do NOT share OTP, pay upfront fees, or click unknown links. "
                    "Call 1930 if you have already lost money."
                ),
            })

    return flags
