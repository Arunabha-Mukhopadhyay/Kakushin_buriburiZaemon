"""
FinMate — FastAPI Entry Point

Endpoints:
  GET  /              → health check
  POST /analyze       → run the full 9-agent LangGraph pipeline
  POST /chat          → grounded follow-up answers from a completed analysis
  GET  /health/rag    → verify FAISS indexes are loaded

Express proxies these under /api/agents (POST /api/agents/analyze, POST /api/agents/chat).
"""

from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from state import FinancialProfileInput, ArthSaathiState
from rag.retriever import preload_all_stores

load_dotenv()


# ── Startup: warm up FAISS indexes ───────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\nFinMate Agent Service starting...")
    print("Loading FAISS indexes into memory...")
    preload_all_stores()
    print("All indexes loaded. Ready to serve.\n")
    yield
    print("FinMate Agent Service shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="FinMate Agent API",
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

@app.api_route("/", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok", "service": "FinMate Agent API"}


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
        "stage_latency_ms":   {},

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
        "fallback_flags": {
            "goal_discovery": False,
            "explainability": False,
            "coach": False,
            "accessibility": False,
        },
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
        "latencyBreakdownMs": result.get("stage_latency_ms", {}),
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
        "fallbackFlags":     result.get("fallback_flags", {}),
    }


class ChatInput(BaseModel):
    message: str = Field(..., min_length=1)
    profile: dict = Field(default_factory=dict)
    analysis: dict = Field(default_factory=dict)
    history: list = Field(default_factory=list)


@app.post("/chat")
async def chat(payload: ChatInput):
    """Answer a follow-up using the analysis the client already has."""
    from agents.chat import build_chat_reply

    reply = build_chat_reply(
        payload.message,
        profile=payload.profile,
        analysis=payload.analysis,
        history=payload.history,
    )
    return {"reply": reply}
