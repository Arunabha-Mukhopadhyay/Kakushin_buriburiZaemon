"""
ArthSaathi — FastAPI Entry Point

Endpoints:
  GET  /              → health check
  POST /analyze       → run the full 9-agent LangGraph pipeline
  GET  /health/rag    → verify FAISS indexes are loaded

Called by Express backend (POST /api/agents/analyze → proxy to here).
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from state import FinancialProfileInput, ArthSaathiState
from rag.retriever import preload_all_stores

load_dotenv()


# ── Startup: warm up FAISS indexes ───────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\nArthSaathi Agent Service starting...")
    print("Loading FAISS indexes into memory...")
    preload_all_stores()
    print("All indexes loaded. Ready to serve.\n")
    yield
    print("ArthSaathi Agent Service shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ArthSaathi Agent API",
    description="9-agent LangGraph pipeline for financial analysis, risk scoring, scam detection, scheme matching, simulation, and coaching.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
async def health():
    return {"status": "ok", "service": "ArthSaathi Agent API"}


@app.get("/health/rag")
async def rag_health():
    """Check which FAISS indexes are loaded."""
    from rag.retriever import _index_cache
    loaded = list(_index_cache.keys())
    expected = ["financial_literacy", "rbi_regulatory", "government_schemes", "scam_patterns"]
    missing  = [s for s in expected if s not in loaded]
    return {
        "loaded":  loaded,
        "missing": missing,
        "ready":   len(missing) == 0,
    }


@app.post("/analyze")
async def analyze(payload: FinancialProfileInput):
    """
    Run the full ArthSaathi pipeline for a given user profile.

    Returns:
        credibility_score, risk_score, eligible_schemes,
        scam_flags, simulation_paths, decision_cards,
        action_plan, final_response
    """
    # Late import to avoid circular imports at module load time
    from graph import graph

    # Build initial state
    initial_state: ArthSaathiState = {
        "profile":            payload.model_dump(),
        "user_message":       payload.userMessage or "",
        "suspicious_input":   payload.suspiciousInput,

        # Placeholders — filled in by agents
        "credibility_score":  0.0,
        "credibility_flags":  [],
        "financial_metrics":  {},
        "risk_score":         0.0,
        "risk_category":      "unknown",
        "risk_breakdown":     {},
        "scam_flags":         [],
        "eligible_schemes":   [],
        "goals":              [],
        "simulation_paths":   {},
        "decision_cards":     [],
        "action_plan":        [],
        "final_response":     "",
    }

    start_time = time.perf_counter()

    try:
        result = await graph.ainvoke(initial_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    elapsed_ms = round((time.perf_counter() - start_time) * 1000)

    return {
        "userId":            payload.userId,
        "latencyMs":         elapsed_ms,
        "credibilityScore":  result["credibility_score"],
        "credibilityFlags":  result["credibility_flags"],
        "financialMetrics":  result["financial_metrics"],
        "riskScore":         result["risk_score"],
        "riskCategory":      result["risk_category"],
        "riskBreakdown":     result["risk_breakdown"],
        "scamFlags":         result["scam_flags"],
        "eligibleSchemes":   result["eligible_schemes"],
        "goals":             result["goals"],
        "simulationPaths":   result["simulation_paths"],
        "decisionCards":     result["decision_cards"],
        "actionPlan":        result["action_plan"],
        "finalResponse":     result["final_response"],
    }
