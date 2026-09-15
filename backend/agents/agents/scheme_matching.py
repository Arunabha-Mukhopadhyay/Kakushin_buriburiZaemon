"""
Scheme Matching Agent — Rule-based eligibility + FAISS enrichment.
Pure Python rules first, FAISS for application instructions.
"""
from __future__ import annotations
from state import ArthSaathiState

def _annual(profile: dict) -> float:
    return float(profile.get("monthlyIncome", 0) or 0) * 12

async def run_scheme_matching(state: ArthSaathiState) -> list[dict]:
    p      = state["profile"]
    annual = _annual(p)
    age    = p.get("age") or 0
    gender = (p.get("gender") or "").lower()
    rural  = p.get("isRural", False)
    emp    = (p.get("employmentType") or "salaried").lower()
    caste  = (p.get("casteCategory") or "general").lower()
    bank   = p.get("hasBankAccount", True)
    ins    = p.get("hasInsurance", False)
    h_ins  = p.get("hasHealthInsurance", False)
    land   = p.get("landHoldingAcres")

    schemes = []

    # ── Jan Dhan ──────────────────────────────────────────────────────────────
    if not bank:
        schemes.append({
            "name": "PM Jan Dhan Yojana (PMJDY)",
            "eligible": True,
            "annual_benefit": 10000,
            "gap": None,
            "how_to_apply": "Visit any bank branch with Aadhaar card. Zero balance account opened same day.",
        })

    # ── PMSBY (accident insurance ₹2L for ₹20/year) ──────────────────────────
    if not ins and bank and 18 <= age <= 70:
        schemes.append({
            "name": "PM Suraksha Bima Yojana (PMSBY)",
            "eligible": True,
            "annual_benefit": 200000,
            "gap": None,
            "how_to_apply": "Ask your bank to auto-debit ₹20/year from your Jan Dhan or savings account.",
        })
    elif not ins and age > 0 and not (18 <= age <= 70):
        schemes.append({
            "name": "PM Suraksha Bima Yojana (PMSBY)",
            "eligible": False,
            "annual_benefit": 0,
            "gap": f"Age {age} is outside the eligible range of 18–70 years.",
            "how_to_apply": None,
        })

    # ── PMJJBY (life insurance ₹2L for ₹436/year) ────────────────────────────
    if not ins and bank and 18 <= age <= 50:
        schemes.append({
            "name": "PM Jeevan Jyoti Bima Yojana (PMJJBY)",
            "eligible": True,
            "annual_benefit": 200000,
            "gap": None,
            "how_to_apply": "Enroll at your bank branch or net banking. Premium ₹436/year auto-debited.",
        })

    # ── APY (pension ₹1k–5k/month) ────────────────────────────────────────────
    if 18 <= age <= 40 and emp not in ["salaried"]:
        schemes.append({
            "name": "Atal Pension Yojana (APY)",
            "eligible": True,
            "annual_benefit": 36000,
            "gap": None,
            "how_to_apply": "Apply at your bank branch. Government co-contributes 50% for first 5 years if enrolled before 40.",
        })

    # ── MUDRA Loan ────────────────────────────────────────────────────────────
    if emp in ["self_employed", "gig"] and annual < 1500000:
        tier = "Shishu (up to ₹50,000)" if annual < 300000 else (
               "Kishore (₹50,000–₹5 lakh)" if annual < 600000 else
               "Tarun (₹5 lakh–₹10 lakh)")
        schemes.append({
            "name": f"PM MUDRA Yojana — {tier}",
            "eligible": True,
            "annual_benefit": 0,
            "gap": None,
            "how_to_apply": "Apply at any bank, MFI, or NBFC. No collateral required for Shishu tier.",
        })

    # ── PM Kisan ──────────────────────────────────────────────────────────────
    if emp == "farmer" and land and land > 0:
        schemes.append({
            "name": "PM Kisan Samman Nidhi",
            "eligible": True,
            "annual_benefit": 6000,
            "gap": None,
            "how_to_apply": "Register at pmkisan.gov.in or nearest CSC with land records and Aadhaar.",
        })

    # ── PMAY (housing) ────────────────────────────────────────────────────────
    if annual < 1800000:
        category = ("EWS" if annual < 300000 else
                    "LIG" if annual < 600000 else
                    "MIG-I" if annual < 1200000 else "MIG-II")
        subsidy  = {"EWS": 267000, "LIG": 267000, "MIG-I": 235000, "MIG-II": 230000}[category]
        pmay_type = "PMAY-Gramin" if rural else f"PMAY-Urban ({category})"
        schemes.append({
            "name": pmay_type,
            "eligible": True,
            "annual_benefit": subsidy,
            "gap": None,
            "how_to_apply": "Apply at pmaymis.gov.in or nearest bank/CSC. Must be first-time home buyer.",
        })

    # ── Ayushman Bharat (PMJAY) ───────────────────────────────────────────────
    if not h_ins and annual < 300000:
        schemes.append({
            "name": "Ayushman Bharat — PM Jan Arogya Yojana (PMJAY)",
            "eligible": True,
            "annual_benefit": 500000,
            "gap": None,
            "how_to_apply": "Check eligibility at pmjay.gov.in → 'Am I Eligible?'. Completely free — no premium.",
        })

    # ── Stand Up India ────────────────────────────────────────────────────────
    if caste in ["sc", "st"] or gender == "female":
        schemes.append({
            "name": "Stand Up India",
            "eligible": True,
            "annual_benefit": 0,
            "gap": None,
            "how_to_apply": "Apply at standupmitra.in. Loan ₹10 lakh–₹1 crore for greenfield enterprise.",
        })

    return schemes
