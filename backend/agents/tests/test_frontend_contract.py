"""Contract checks for the fields and chat route the React client reads."""
from agents.chat import build_chat_reply
from simulation.monte_carlo import run_simulation


def test_simulation_paths_include_chart_series():
    result = run_simulation(
        monthly_income=40000,
        monthly_expenses=22000,
        monthly_emi=3000,
        existing_savings=80000,
        existing_debt=50000,
        risk_appetite="moderate",
        goal_amount=200000,
        goal_horizon_months=12,
    )

    for name in ("status_quo", "moderate", "optimal"):
        path = result[name]
        series = path["monthly_data"]
        assert len(series) == 36
        assert series[0]["month"] == 1
        assert series[-1]["month"] == 36
        assert series[-1]["median"] == path["projected_value"]
        assert "net_worth_median" in series[0]
        assert path["goal_evaluated_at"] == 12


def test_chat_reply_uses_analysis_numbers():
    reply = build_chat_reply(
        "What is my emergency runway?",
        profile={"monthlyIncome": 50000, "monthlyExpenses": 20000, "existingSavings": 40000},
        analysis={
            "financialMetrics": {
                "monthly_surplus": 25000,
                "emergency_months": 2,
                "dti_ratio": 0.1,
            }
        },
    )
    assert "2.0 months" in reply
    assert "₹40,000" in reply or "40,000" in reply
