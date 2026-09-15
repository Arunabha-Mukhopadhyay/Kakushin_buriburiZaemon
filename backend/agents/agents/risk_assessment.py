"""Risk Assessment Agent — Pure Python, composite 0–100 health score.

NOTE: This agent computes its own financial metrics directly from the profile.
It does NOT read from financial_metrics in state because both agents
run in parallel — financial_metrics is empty when this agent executes.
"""
from __future__ import annotations
from state import ArthSaathiState

async def run_risk_assessment(state: ArthSaathiState) -> dict:
    p = state["profile"]

    income   = float(p.get("monthlyIncome", 1) or 1)
    expenses = float(p.get("monthlyExpenses", 0) or 0)
    emi      = float(p.get("monthlyEmi", 0) or 0)
    savings  = float(p.get("existingSavings", 0) or 0)
    emp_type = p.get("employmentType", "salaried")

    # Compute own metrics — never read from state["financial_metrics"] (parallel race)
    dti             = emi / income if income > 0 else 0
    surplus         = income - expenses - emi
    emergency_months = savings / expenses if expenses > 0 else 0

    # Each dimension: 0–100 (higher = healthier)
    debt_score       = max(0.0, round(100 - (dti * 200), 1))
    emergency_score  = min(100.0, round((emergency_months / 6) * 100, 1))
    income_score     = float({"salaried": 100, "self_employed": 75,
                               "gig": 60, "farmer": 55, "daily_wage": 40,
                               "unemployed": 10}.get(emp_type, 60))
    surplus_score    = min(100.0, max(0.0, round((surplus / income) * 200, 1)))
    investment_score = min(100.0, round((savings / (income * 3)) * 100, 1))

    composite = round(
        (debt_score      * 0.30) +
        (emergency_score * 0.25) +
        (income_score    * 0.20) +
        (surplus_score   * 0.15) +
        (investment_score * 0.10),
        1,
    )

    category = "low" if composite >= 70 else ("moderate" if composite >= 40 else "high")

    return {
        "risk_score":    composite,
        "risk_category": category,
        "risk_breakdown": {
            "debt_score":        debt_score,
            "emergency_score":   emergency_score,
            "income_score":      income_score,
            "surplus_score":     surplus_score,
            "investment_score":  investment_score,
        },
    }
