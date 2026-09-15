"""Future Simulation Agent — wraps Monte Carlo engine."""
from __future__ import annotations
from state import ArthSaathiState
from simulation.monte_carlo import run_simulation

async def run_future_simulation(state: ArthSaathiState) -> dict:
    p      = state["profile"]
    goals  = state.get("goals", [])

    goal_amount = 0
    if goals:
        top_goal    = min(goals, key=lambda g: g.get("priority", 99))
        goal_amount = float(top_goal.get("target_amount") or 0)

    return run_simulation(
        monthly_income=float(p.get("monthlyIncome", 0) or 0),
        monthly_expenses=float(p.get("monthlyExpenses", 0) or 0),
        monthly_emi=float(p.get("monthlyEmi", 0) or 0),
        existing_savings=float(p.get("existingSavings", 0) or 0),
        existing_debt=float(p.get("existingDebt", 0) or 0),
        risk_appetite=p.get("riskAppetite", "moderate"),
        goal_amount=goal_amount,
    )
