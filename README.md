# FinMate

**AI-Powered Financial Clarity for Everyday Indians.**  
*An intelligent financial companion for risk assessment, government welfare matching, scam protection, and personalized wealth simulations.*

---

## Overview

Managing personal finances in India's informal and gig economy presents unique challenges. Millions of delivery partners, commercial drivers, street vendors, and independent earners navigate variable income streams, informal debt burdens, and complex financial terminology without access to unbiased, professional guidance.

FinMate addresses this gap.

Rather than distributing commercial credit products or promoting complex investments, FinMate provides objective, personalized financial navigation. The system evaluates true net cash flows, quantifies emergency runway reserves, safeguards users against predatory lending scams, matches eligible government welfare programs, and explains recommendations through clear written reports and interactive voice conversation.

---

## Core Capabilities

### 1. Financial Health and Risk Assessment
- Analyzes monthly income, recurring living expenses, existing debt obligations, and liquid reserves.
- Computes an itemized **Financial Health Score (0–100)** evaluating five core dimensions:
  - **Protection:** Adequacy of term life, accident, and health insurance coverage.
  - **Liquidity:** Emergency runway measured in months of essential living expenses covered.
  - **Debt Burden:** Debt-to-Income (DTI) ratio and outstanding informal liabilities.
  - **Cash Flow:** Real monthly disposable surplus available for structured savings.
  - **Risk Alignment:** Alignment of current allocations with stated risk preferences.

### 2. Government Welfare and Scheme Matching (RAG Engine)
- Employs domain-separated vector retrieval across verified regulatory and government databases.
- Identifies social security, insurance, and financial inclusion programs based on user demographics:
  - **Pradhan Mantri Suraksha Bima Yojana (PMSBY):** Accidental death and disability protection for Rs 20 per year.
  - **Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY):** Life insurance coverage for Rs 436 per year.
  - **Atal Pension Yojana (APY):** Guaranteed monthly pension for unorganized sector workers.
  - **PMAY (Urban/Gramin):** Credit-linked subsidy and interest concessions for housing.
  - **PMMY (Mudra Loans):** Collateral-free micro-enterprise financing.

### 3. Scam and Fraud Prevention
- Evaluates suspicious loan offers, text messages, and investment solicitations against documented fraud vectors.
- Flags predatory lending applications, advance-fee lottery schemes, fraudulent KYC expiration notices, and authority impersonation tactics.
- Provides immediate mitigation guidance along with direct access to the national cyber fraud helpline (**1930**).

### 4. 36-Month Monte Carlo Wealth Simulation
- Implements a pure NumPy simulation executing **1,000 stochastic iterations over a 36-month horizon**.
- Models three distinct financial trajectories:
  - **Status Quo:** Continuation of existing spending and debt maintenance patterns.
  - **Moderate Path:** Baseline reductions in non-essential expenditures paired with disciplined savings.
  - **Optimal Plan:** Targeted debt amortization, emergency reserve accumulation, and structured goal contributions.
- Generates probability distributions for goal achievement and tracks projected net worth evolution over time.

### 5. Goal Discovery and Behavioral Action Planning
- Extracts structured financial objectives from conversational inputs (emergency cushions, education funds, debt retirement, vehicle acquisitions).
- Produces prioritized **Decision Cards** detailing recommended actions, underlying rationale, and risks of inaction.
- Converts high-level recommendations into achievable daily and weekly milestones.

### 6. Full-Duplex Voice Assistant ("Ask FinMate")
- **Browser-Native Speech-to-Text (STT):** Captures voice inputs in English and Indic accents directly via client-side APIs.
- **Context-Grounded LLM Reasoning:** Processes user inquiries against complete financial profiles and metrics to provide clear mathematical explanations for computed scores and affordability questions.
- **Browser-Native Text-to-Speech (TTS):** Synthesizes clear audio summaries with playback controls on individual response cards.

---

## System Architecture

```
                     ┌───────────────────────────────────┐
                     │          FinMate Frontend         │
                     │  React 19 • Vite • Recharts • CSS │
                     └─────────────────┬─────────────────┘
                                       │
                      HTTP /api/agents │ (Port 3001)
                                       ▼
                     ┌───────────────────────────────────┐
                     │       Express Gateway Server      │
                     │      Node.js • TypeScript • CORS  │
                     └─────────────────┬─────────────────┘
                                       │
                        HTTP /analyze  │ (Port 8000)
                                       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                        FastAPI Agent Service                           │
  │                  LangGraph Orchestrator (10-Node DAG)                  │
  │                                                                        │
  │  [Credibility Validation Engine]                                       │
  │          │                                                             │
  │          ▼                                                             │
  │  [Parallel Execution Layer via asyncio]                                │
  │     ├── Financial Analysis Engine (Cash Flow & Metrics)                │
  │     ├── Risk Assessment Engine (Multi-Pillar Scoring)                  │
  │     ├── Scam Detection Agent (FAISS + Heuristic Rules)                 │
  │     ├── Scheme Matching Agent (FAISS Vector Store)                     │
  │     └── Goal Discovery Agent (Groq LLM)                                │
  │          │                                                             │
  │          ▼                                                             │
  │  [36-Month Monte Carlo Simulation (NumPy)]                             │
  │          │                                                             │
  │          ▼                                                             │
  │  [Explainability Agent → Decision Cards (Groq LLM)]                    │
  │          │                                                             │
  │          ▼                                                             │
  │  [Behavioral Coach Agent → Action Plan (Groq LLM)]                     │
  │          │                                                             │
  │          ▼                                                             │
  │  [Accessibility Agent → Voice Summary (Groq LLM)]                      │
  └────────────────────────────────────────────────────────────────────────┘
```

### Technology Matrix

| Subsystem | Stack |
| :--- | :--- |
| **Frontend** | React 19, Vite, Recharts, Lucide Icons, W3C Web Speech API |
| **Gateway Server** | Express, Node.js, TypeScript, Prisma ORM, PostgreSQL |
| **Agent Pipeline** | Python 3.11, FastAPI, LangGraph, Groq Cloud API |
| **Vector Retrieval**| FAISS, SentenceTransformers (`paraphrase-multilingual-MiniLM-L12-v2`) |
| **Simulation** | NumPy, SciPy |

---

## Local Development Setup

### Prerequisites
- Node.js v18 or later
- Python 3.11 or later
- `uv` package manager (or `pip`)

---

### Environment Configuration

**Agent Service** (`backend/agents/.env`):
```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key
GROQ_CHAT_MODEL=openai/gpt-oss-120b
GROQ_MODEL=openai/gpt-oss-120b

# Vector Indices & Knowledge Base
KNOWLEDGE_BASE_PATH="../knowledge_base"
FAISS_INDEX_PATH="./rag/indexes"

PORT=8000
```

**Express Gateway** (`backend/server/.env`):
```env
PORT=3001
DATABASE_URL="postgresql://postgres:password@localhost:5432/finmate?sslmode=prefer"
```

---

### Ingestion Pipeline

To build and persist the domain-separated FAISS indices:
```bash
cd backend/agents
uv run python -m rag.ingest
```

---

### Running the Services

**1. Python Agent Service (FastAPI):**
```bash
cd backend/agents
uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**2. Express Gateway Server:**
```bash
cd backend/server
npm install
npm run dev
```

**3. Frontend Client:**
```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## Verification and Testing

- **Frontend Bundle Compilation:**
  ```bash
  cd frontend && npm run build
  ```
- **Backend Contract Verification:**
  ```bash
  cd backend/agents && uv run pytest tests/
  ```
- **Service Health Check:**
  ```bash
  curl http://127.0.0.1:8000/
  curl http://127.0.0.1:8000/health/rag
  ```

---

## Data Privacy and Governance

1. **Client-Side Speech Processing:** Audio capture and speech-to-text processing take place within the client browser, minimizing voice data transmission.
2. **Deterministic Arithmetic:** Numerical calculations, debt-to-income ratios, and emergency runway metrics are computed deterministically via standard financial formulas rather than generative approximations.
3. **Domain-Specific Isolation:** Regulatory, scam pattern, and scheme vector indices are isolated from one another to prevent cross-domain data leakage.

---

## License

This project is distributed under the MIT License.
