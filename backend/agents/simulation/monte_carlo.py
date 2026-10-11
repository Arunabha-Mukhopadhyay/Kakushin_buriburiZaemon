"""
Monte Carlo Simulation — Pure NumPy, zero LLM.

Runs 1000 iterations × 36 months across 3 trajectories:
  A) Status Quo     — no behavioural change
  B) Moderate       — small improvements
  C) Optimal        — full ArthSaathi plan

Features:
- Horizon-aware goal evaluation (evaluates at goal's actual horizon rather than month 36).
- Net worth tracking (Savings - Debt) so debt paydown accurately reflects wealth creation.
- 10% annual debt interest modeling on outstanding debt balances.
"""
from __future__ import annotations
import numpy as np

MONTHS        = 36
ITERATIONS    = 1000
INFLATION     = 0.06 / 12       # 6% annual inflation → monthly
DEBT_INTEREST = 0.10 / 12       # 10% annual debt APR → monthly
RANDOM_SEED   = 42

RETURN_RATES = {
    "conservative": 0.07 / 12,
    "moderate":     0.10 / 12,
    "aggressive":   0.12 / 12,
}


def run_simulation(
    monthly_income:      float,
    monthly_expenses:    float,
    monthly_emi:         float,
    existing_savings:    float,
    existing_debt:       float,
    risk_appetite:       str = "moderate",
    goal_amount:         float = 0,
    goal_horizon_months: int | None = None,
) -> dict:
    """
    Returns a dict with three simulation paths (status_quo, moderate, optimal).
    Each path contains projected savings, projected net worth, and horizon-aware goal success.
    """
    rng         = np.random.default_rng(RANDOM_SEED)
    return_rate = RETURN_RATES.get(risk_appetite, RETURN_RATES["moderate"])
    surplus     = monthly_income - monthly_expenses - monthly_emi

    # Determine horizon month for goal checking (1-indexed)
    if goal_horizon_months and goal_horizon_months > 0:
        target_check_month = min(int(goal_horizon_months), MONTHS)
    else:
        target_check_month = MONTHS

    target_idx = target_check_month - 1

    def simulate_path(
        extra_savings_pct: float,   # additional % of income saved
        debt_reduction:    float,   # extra monthly debt payment
        sip_amount:        float,   # monthly SIP
        expense_cut_pct:   float,   # % reduction in discretionary expenses
    ) -> dict:
        """Run ITERATIONS Monte Carlo paths for given behaviour."""
        vol = {"conservative": 0.008, "moderate": 0.015, "aggressive": 0.025}.get(risk_appetite, 0.015)

        monthly_savings = np.zeros((ITERATIONS, MONTHS))
        monthly_net_worth = np.zeros((ITERATIONS, MONTHS))
        monthly_debt = np.zeros((ITERATIONS, MONTHS))

        for i in range(ITERATIONS):
            savings     = existing_savings
            debt        = existing_debt
            monthly_exp = monthly_expenses * (1 - expense_cut_pct)

            for m in range(MONTHS):
                # Monthly investment return with stochastic volatility
                monthly_return = return_rate + rng.normal(0, vol)
                savings *= (1 + monthly_return)

                # Accrue interest on outstanding debt
                if debt > 0:
                    debt *= (1 + DEBT_INTEREST)

                # Monthly surplus contribution + SIP
                effective_surplus = monthly_income - monthly_exp - monthly_emi
                savings += max(0, effective_surplus * (1 + extra_savings_pct)) + sip_amount

                # Debt paydown
                if debt > 0 and debt_reduction > 0:
                    payment = min(debt, debt_reduction)
                    debt   -= payment
                    savings -= payment

                # Inflation erodes expenses over time
                monthly_exp *= (1 + INFLATION)

                # Record monthly state
                monthly_savings[i, m]   = max(0.0, savings)
                monthly_debt[i, m]      = max(0.0, debt)
                monthly_net_worth[i, m] = savings - debt

        # Month 36 ending percentiles
        p10_savings = float(np.percentile(monthly_savings[:, -1], 10))
        p50_savings = float(np.percentile(monthly_savings[:, -1], 50))
        p90_savings = float(np.percentile(monthly_savings[:, -1], 90))

        p50_net_worth = float(np.percentile(monthly_net_worth[:, -1], 50))
        p50_debt      = float(np.percentile(monthly_debt[:, -1], 50))

        # Goal success probability evaluated at target horizon month
        if goal_amount > 0:
            success_prob = float(np.mean(monthly_savings[:, target_idx] >= goal_amount))
        else:
            success_prob = None

        return {
            "projected_value":     round(p50_savings, 2),
            "p10_value":           round(p10_savings, 2),
            "p90_value":           round(p90_savings, 2),
            "projected_net_worth": round(p50_net_worth, 2),
            "remaining_debt":      round(p50_debt, 2),
            "success_prob":        round(success_prob, 4) if success_prob is not None else None,
            "horizon_months":      MONTHS,
            "goal_evaluated_at":   target_check_month if goal_amount > 0 else None,
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
