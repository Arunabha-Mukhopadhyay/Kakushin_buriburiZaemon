"""
Monte Carlo Simulation — Pure NumPy, zero LLM.

Runs 1000 iterations × 36 months across 3 trajectories:
  A) Status Quo     — no behavioural change
  B) Moderate       — small improvements
  C) Optimal        — full ArthSaathi plan
"""
from __future__ import annotations
import numpy as np

MONTHS       = 36
ITERATIONS   = 1000
INFLATION    = 0.06 / 12      # 6% annual → monthly
RANDOM_SEED  = 42

RETURN_RATES = {
    "conservative": 0.07 / 12,
    "moderate":     0.10 / 12,
    "aggressive":   0.12 / 12,
}

def run_simulation(
    monthly_income:   float,
    monthly_expenses: float,
    monthly_emi:      float,
    existing_savings: float,
    existing_debt:    float,
    risk_appetite:    str = "moderate",
    goal_amount:      float = 0,
) -> dict:
    """
    Returns a dict with three simulation paths.
    Each path contains projected corpus statistics.
    """
    rng          = np.random.default_rng(RANDOM_SEED)
    return_rate  = RETURN_RATES.get(risk_appetite, RETURN_RATES["moderate"])
    surplus      = monthly_income - monthly_expenses - monthly_emi

    def simulate_path(
        extra_savings_pct: float,   # additional % of income saved
        debt_reduction:    float,   # extra monthly debt payment
        sip_amount:        float,   # monthly SIP
        expense_cut_pct:   float,   # % reduction in discretionary expenses
    ) -> dict:
        """Run ITERATIONS Monte Carlo paths for given behaviour."""
        # Monthly volatility (std dev) varies by risk appetite
        vol = {"conservative": 0.008, "moderate": 0.015, "aggressive": 0.025}.get(risk_appetite, 0.015)

        corpus_end = np.zeros(ITERATIONS)

        for i in range(ITERATIONS):
            savings      = existing_savings
            debt         = existing_debt
            monthly_exp  = monthly_expenses * (1 - expense_cut_pct)

            for m in range(MONTHS):
                # Random return for this month
                monthly_return = return_rate + rng.normal(0, vol)

                # Investment growth
                savings *= (1 + monthly_return)

                # Contributions
                effective_surplus = monthly_income - monthly_exp - monthly_emi
                savings += max(0, effective_surplus * (1 + extra_savings_pct)) + sip_amount

                # Debt paydown
                if debt > 0:
                    debt_payment = min(debt, debt_reduction)
                    debt        -= debt_payment
                    savings     -= debt_payment

                # Inflation erodes expenses over time
                monthly_exp *= (1 + INFLATION)

            corpus_end[i] = max(0, savings)

        p10 = float(np.percentile(corpus_end, 10))
        p50 = float(np.percentile(corpus_end, 50))
        p90 = float(np.percentile(corpus_end, 90))

        success_prob = float(np.mean(corpus_end >= goal_amount)) if goal_amount > 0 else None

        return {
            "projected_value": round(p50, 2),
            "p10_value":       round(p10, 2),
            "p90_value":       round(p90, 2),
            "success_prob":    round(success_prob, 4) if success_prob is not None else None,
            "horizon_months":  MONTHS,
        }

    return {
        "status_quo": simulate_path(
            extra_savings_pct=0.0,
            debt_reduction=0,
            sip_amount=0,
            expense_cut_pct=0.0,
        ),
        "moderate": simulate_path(
            extra_savings_pct=0.05,
            debt_reduction=max(0, surplus * 0.1),
            sip_amount=500,
            expense_cut_pct=0.05,
        ),
        "optimal": simulate_path(
            extra_savings_pct=0.15,
            debt_reduction=max(0, surplus * 0.3),
            sip_amount=max(500, surplus * 0.2),
            expense_cut_pct=0.10,
        ),
    }
