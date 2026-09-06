"""
ArthSaathi — Shared State Definition

This TypedDict flows through the entire LangGraph pipeline.
Every agent reads from and writes to this state.

Rule: Only Python agents write to financial_metrics, risk_score, simulation_paths.
      Only LLM agents write to decision_cards, action_plan, final_response.
"""

from __future__ import annotations
from typing import Optional
from typing_extensions import TypedDict
from pydantic import BaseModel, Field



class FinancialProfileInput(BaseModel):
    """Validated input from the user / frontend form."""

    userId: str

    # Core financials
    monthlyIncome: float = Field(..., gt=0, description="Monthly income in INR")
    monthlyExpenses: float = Field(..., ge=0)
    monthlyEmi: float = Field(default=0, ge=0)
    existingSavings: float = Field(default=0, ge=0)
    existingDebt: float = Field(default=0, ge=0)
    dependents: int = Field(default=0, ge=0)
    employmentType: str = Field(default="salaried")   # salaried|gig|self_employed|farmer|daily_wage|unemployed

    # Demographics (scheme matching)
    age: Optional[int] = Field(default=None, ge=1, le=120)
    gender: Optional[str] = None                       # male|female|other
    state: Optional[str] = None                        # Indian state name
    isRural: bool = False
    casteCategory: Optional[str] = None                # general|obc|sc|st
    landHoldingAcres: Optional[float] = None           # farmers only
    businessType: Optional[str] = None                 # self-employed/gig only

    # Insurance & banking gaps
    hasBankAccount: bool = True
    hasInsurance: bool = False
    hasHealthInsurance: bool = False

    # Simulation preference
    riskAppetite: str = "moderate"                     # conservative|moderate|aggressive

    # Accessibility
    preferredLang: str = "en"                          # en|hi|mr|kn

    # Optional scam detection input
    suspiciousInput: Optional[str] = None

    # Optional user message / goal statement
    userMessage: Optional[str] = None



class ArthSaathiState(TypedDict):
    """
    Passed between all 10 nodes in the LangGraph pipeline.
    Agents only write to their own output keys — never overwrite others.
    """

    profile: dict                   # FinancialProfileInput.model_dump()
    user_message: str
    suspicious_input: Optional[str]

    credibility_score: float        # 0–100 (100 = fully credible data)
    credibility_flags: list[str]    # e.g. ["debt_exceeds_2x_annual_income"]

    financial_metrics: dict
    # {
    #   dti_ratio: float,           debt-to-income ratio
    #   monthly_surplus: float,     income - expenses - emi
    #   emergency_months: float,    savings / expenses
    #   income_volatility: bool,    true for gig/farmer/daily-wage
    #   annual_income: float,
    # }

    risk_score: float               # composite 0–100
    risk_category: str              # "low" | "moderate" | "high"
    risk_breakdown: dict
    # {
    #   debt_score: float,
    #   emergency_score: float,
    #   income_score: float,
    #   surplus_score: float,
    #   investment_score: float,
    # }

    scam_flags: list[dict]
    # [ { pattern: str, confidence: float, scam_type: str, warning: str } ]

    eligible_schemes: list[dict]
    # [ { name: str, eligible: bool, gap: str|None, annual_benefit: float, how_to_apply: str } ]

    goals: list[dict]
    # [ { title: str, target_amount: float|None, horizon_months: int|None, priority: int } ]

    simulation_paths: dict
    # {
    #   status_quo:  { projected_value, success_prob, p10, p90, monthly_data: [...] }
    #   moderate:    { ... }
    #   optimal:     { ... }
    # }

    decision_cards: list[dict]
    # [ { action: str, why: str, if_ignored: str, priority: int } ]

    action_plan: list[dict]
    # [ { task: str, daily_amount: float|None, deadline: str|None, scheme: str|None } ]

    final_response: str             # fully formatted, language-adapted response for the user
