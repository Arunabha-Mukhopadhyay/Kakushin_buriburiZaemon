"""Financial Analysis Agent — Pure Python, no LLM."""
from __future__ import annotations
from state import ArthSaathiState

async def run_financial_analysis(state: ArthSaathiState) -> dict:
    p = state["profile"]
    income   = float(p.get("monthlyIncome", 0) or 0)
    expenses = float(p.get("monthlyExpenses", 0) or 0)
    emi      = float(p.get("monthlyEmi", 0) or 0)
    savings  = float(p.get("existingSavings", 0) or 0)
    debt     = float(p.get("existingDebt", 0) or 0)

    surplus          = income - expenses - emi
    dti_ratio        = (emi / income) if income > 0 else 0
    emergency_months = (savings / expenses) if expenses > 0 else 0
    annual_income    = income * 12
    income_volatile  = p.get("employmentType") in ["gig", "farmer", "daily_wage"]

    return {
        "monthly_surplus":    round(surplus, 2),
        "dti_ratio":          round(dti_ratio, 4),
        "emergency_months":   round(emergency_months, 2),
        "annual_income":      round(annual_income, 2),
        "income_volatility":  income_volatile,
        "total_debt":         debt,
        "savings":            savings,
    }
