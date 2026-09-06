"""
ArthSaathi — Credibility Validation Engine

Runs BEFORE any LangGraph agent.
Pure Python — zero LLM involvement.

Scores the user's financial input on a 0–100 scale.
Flags data that looks implausible so downstream agents
can caveat their outputs accordingly.
"""

from __future__ import annotations


def compute_credibility(profile: dict) -> tuple[float, list[str]]:
    """
    Validate the financial profile and return a (score, flags) tuple.

    Args:
        profile: dict from FinancialProfileInput.model_dump()

    Returns:
        score: float 0–100 (100 = fully credible)
        flags: list of string flag codes
    """
    score = 100.0
    flags: list[str] = []

    income   = float(profile.get("monthlyIncome", 0) or 0)
    expenses = float(profile.get("monthlyExpenses", 0) or 0)
    emi      = float(profile.get("monthlyEmi", 0) or 0)
    debt     = float(profile.get("existingDebt", 0) or 0)
    savings  = float(profile.get("existingSavings", 0) or 0)
    deps     = int(profile.get("dependents", 0) or 0)

    annual_income = income * 12

    if income <= 0:
        score -= 40
        flags.append("invalid_income")

    if expenses < 0:
        score -= 20
        flags.append("invalid_expenses")

    if debt < 0 or savings < 0 or emi < 0:
        score -= 15
        flags.append("negative_values")

    if annual_income > 0 and debt > annual_income * 2:
        score -= 20
        flags.append("debt_exceeds_2x_annual_income")

    if income > 0 and expenses > income * 1.5:
        score -= 15
        flags.append("expenses_exceed_150pct_income")

    if income > 0 and savings > income * 120:
        # savings > 10 years of income is implausible without explanation
        score -= 15
        flags.append("implausible_savings")

    if income > 0 and emi > income:
        score -= 15
        flags.append("emi_exceeds_income")

    if income > 0 and (emi + expenses) > income * 1.8:
        score -= 10
        flags.append("total_obligations_exceed_180pct_income")

    if deps > 15:
        score -= 5
        flags.append("implausible_dependents_count")

    return max(0.0, round(score, 1)), flags


def credibility_summary(score: float, flags: list[str]) -> str:
    """
    Human-readable one-liner for the Explainability Agent.
    """
    if score >= 85:
        return "Financial data looks consistent and credible."
    if score >= 60:
        level = "minor"
    elif score >= 40:
        level = "moderate"
    else:
        level = "significant"

    flag_text = ", ".join(f.replace("_", " ") for f in flags)
    return (
        f"Data has {level} consistency issues ({flag_text}). "
        "Recommendations are still provided but treat projections as approximate."
    )
