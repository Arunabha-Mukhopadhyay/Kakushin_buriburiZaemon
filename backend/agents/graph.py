"""
ArthSaathi — LangGraph Orchestrator

Wires all 10 nodes into the pipeline:

  START
    └─► credibility_node
          └─► parallel_layer_node   (runs 5 agents concurrently via asyncio)
                └─► future_simulation_node
                      └─► explainability_node
                            └─► coach_node
                                  └─► accessibility_node
                                        └─► END

The parallel layer uses asyncio.gather so all 5 agents run
simultaneously — total latency = slowest single agent, not sum.
"""

from __future__ import annotations

import asyncio
from langgraph.graph import StateGraph, START, END

from state import ArthSaathiState
from credibility import compute_credibility, credibility_summary

# Agent imports (each module exposes a single async run_* function)
from agents.financial_analysis import run_financial_analysis
from agents.risk_assessment     import run_risk_assessment
from agents.scam_detection      import run_scam_detection
from agents.scheme_matching     import run_scheme_matching
from agents.goal_discovery      import run_goal_discovery
from agents.future_simulation   import run_future_simulation
from agents.explainability      import run_explainability
from agents.coach               import run_coach
from agents.accessibility       import run_accessibility



async def credibility_node(state: ArthSaathiState) -> dict:
    score, flags = compute_credibility(state["profile"])
    return {
        "credibility_score": score,
        "credibility_flags": flags,
    }



async def parallel_layer_node(state: ArthSaathiState) -> dict:
    """
    All 5 parallel agents run simultaneously.
    Total latency = max(individual agent latencies), not sum.
    """
    (
        financial_metrics,
        risk_result,
        scam_flags,
        eligible_schemes,
        goals,
    ) = await asyncio.gather(
        run_financial_analysis(state),
        run_risk_assessment(state),
        run_scam_detection(state),
        run_scheme_matching(state),
        run_goal_discovery(state),
    )

    return {
        "financial_metrics": financial_metrics,
        "risk_score":        risk_result["risk_score"],
        "risk_category":     risk_result["risk_category"],
        "risk_breakdown":    risk_result["risk_breakdown"],
        "scam_flags":        scam_flags,
        "eligible_schemes":  eligible_schemes,
        "goals":             goals,
    }


# ── Node 3: Future Simulation ─────────────────────────────────────────────────

async def future_simulation_node(state: ArthSaathiState) -> dict:
    simulation_paths = await run_future_simulation(state)
    return {"simulation_paths": simulation_paths}


# ── Node 4: Explainability ────────────────────────────────────────────────────

async def explainability_node(state: ArthSaathiState) -> dict:
    decision_cards = await run_explainability(state)
    return {"decision_cards": decision_cards}


# ── Node 5: Coach ─────────────────────────────────────────────────────────────

async def coach_node(state: ArthSaathiState) -> dict:
    action_plan = await run_coach(state)
    return {"action_plan": action_plan}


# ── Node 6: Accessibility ─────────────────────────────────────────────────────

async def accessibility_node(state: ArthSaathiState) -> dict:
    final_response = await run_accessibility(state)
    return {"final_response": final_response}


# ── Graph assembly ────────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    workflow = StateGraph(ArthSaathiState)

    # Register nodes
    workflow.add_node("credibility",       credibility_node)
    workflow.add_node("parallel_layer",    parallel_layer_node)
    workflow.add_node("future_simulation", future_simulation_node)
    workflow.add_node("explainability",    explainability_node)
    workflow.add_node("coach",             coach_node)
    workflow.add_node("accessibility",     accessibility_node)

    # Wire edges
    workflow.add_edge(START,               "credibility")
    workflow.add_edge("credibility",       "parallel_layer")
    workflow.add_edge("parallel_layer",    "future_simulation")
    workflow.add_edge("future_simulation", "explainability")
    workflow.add_edge("explainability",    "coach")
    workflow.add_edge("coach",             "accessibility")
    workflow.add_edge("accessibility",     END)

    return workflow.compile()


# Compiled graph — imported by main.py
graph = build_graph()
