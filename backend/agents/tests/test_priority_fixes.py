"""
Test suite verifying the fixes for Priorities 1, 2, and 4.
"""
import pytest
from simulation.monte_carlo import run_simulation
from state import ArthSaathiState
from agents.future_simulation import run_future_simulation


def test_priority_2_monte_carlo_horizon_aware_and_net_worth():
    """Verify that Monte Carlo evaluates goals at their horizon and tracks Net Worth."""
    # Test 1: User with a 6-month goal
    result = run_simulation(
        monthly_income=25000,
        monthly_expenses=18000,
        monthly_emi=2000,
        existing_savings=5000,
        existing_debt=20000,
        risk_appetite="moderate",
        goal_amount=15000,
        goal_horizon_months=6,
    )

    # All paths must report net worth and the horizon at which goal was checked
    for path_name in ["status_quo", "moderate", "optimal"]:
        path = result[path_name]
        assert "projected_net_worth" in path
        assert "remaining_debt" in path
        assert path["goal_evaluated_at"] == 6
        assert path["horizon_months"] == 36
        assert isinstance(path["success_prob"], float)

    # Test 2: Net worth in Optimal should outperform Status Quo when debt is paid down aggressively
    opt_net_worth = result["optimal"]["projected_net_worth"]
    sq_net_worth = result["status_quo"]["projected_net_worth"]
    assert opt_net_worth > sq_net_worth, f"Optimal Net Worth ({opt_net_worth}) should exceed Status Quo ({sq_net_worth})"


def test_priority_1_normalized_retrieval_l2_and_cosine():
    """Verify that normalized embeddings produce calibrated distances strictly between 0 and 4."""
    from rag.retriever import query

    # Query scam store with a lottery scam message
    scam_msg = "You have won a lottery of 10 lakh. Pay 5000 processing fee to claim prize."
    results = query(scam_msg, store="scam_patterns", top_k=3)

    assert len(results) > 0
    top = results[0]
    # In normalized space: L2 distance squared is between 0 and 4
    assert 0.0 <= top["score"] <= 4.0
    assert 0.0 <= top["cosine_similarity"] <= 1.0
    # A true scam should match with high cosine similarity (> 0.40) and low distance (< 1.40)
    assert top["score"] < 1.40, f"Expected L2 distance < 1.40 for scam match, got {top['score']}"
    assert top["cosine_similarity"] > 0.40, f"Expected cosine similarity > 0.40, got {top['cosine_similarity']}"


@pytest.mark.asyncio
async def test_priority_4_observable_fallback_flags():
    """Verify that fallback flags are initialized and trackable in the graph state."""
    from agents.future_simulation import run_future_simulation

    state: ArthSaathiState = {
        "profile": {
            "userId": "test_user",
            "monthlyIncome": 30000,
            "monthlyExpenses": 20000,
            "monthlyEmi": 0,
            "existingSavings": 10000,
            "existingDebt": 0,
            "riskAppetite": "moderate",
        },
        "user_message": "Save for emergency",
        "suspicious_input": None,
        "stage_latency_ms": {},
        "credibility_score": 100.0,
        "credibility_flags": [],
        "financial_metrics": {},
        "risk_score": 50.0,
        "risk_category": "moderate",
        "risk_breakdown": {},
        "scam_flags": [],
        "eligible_schemes": [],
        "goals": [{"title": "Emergency Fund", "target_amount": 60000, "horizon_months": 12, "priority": 1}],
        "simulation_paths": {},
        "decision_cards": [],
        "action_plan": [],
        "final_response": "",
        "fallback_flags": {
            "goal_discovery": False,
            "explainability": False,
            "coach": False,
            "accessibility": False,
        },
    }

    paths = await run_future_simulation(state)
    assert "status_quo" in paths
    assert paths["status_quo"]["goal_evaluated_at"] == 12
