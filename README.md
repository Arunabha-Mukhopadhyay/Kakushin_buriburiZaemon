# 🪙 FinMate
> **AI-Powered Financial Clarity for Everyday Indians.**  
> *Your trusted companion for risk assessment, government scheme matching, scam protection, and personalized wealth simulations.*

---

## 🌟 The Vision

Managing money in India’s informal and gig economy is tough. Millions of delivery partners, drivers, shopkeepers, and freelance workers navigate unpredictable income cycles, informal debts, and complex financial terminology without access to unbiased financial advice.

**FinMate** was built to change that. 

Instead of pushing high-risk investment products or generic bank loans, FinMate acts as a genuine companion (*Saarthi*). It looks at your real cash flows, evaluates your emergency runway, shields you from predatory scams, connects you with government welfare benefits you qualify for, and explains every recommendation in plain, human language—both in writing and through **interactive voice conversation**.

---

## ✨ What FinMate Can Do

### 1. 🛡️ Financial Health & Risk Scoring
- Analyzes your monthly income, living expenses, existing debt, and emergency savings.
- Computes an itemized **Financial Health Score (0–100)** evaluating five core pillars:
  - **Protection:** Insurance coverage (life, health, accident).
  - **Liquidity:** Emergency runway buffer (months of living expenses covered).
  - **Debt Burden:** Debt-to-Income (DTI) ratio and outstanding informal liabilities.
  - **Cash Flow:** Real monthly surplus available to save or invest.
  - **Risk Alignment:** Balancing your comfort level with actionable next steps.

### 2. 🏛️ Government Scheme Matching (RAG Engine)
- Uses domain-separated **FAISS vector search** across curated regulatory and government scheme databases.
- Identifies social security and financial inclusion schemes you qualify for, such as:
  - **Pradhan Mantri Suraksha Bima Yojana (PMSBY)** — Accidental death & disability cover for ₹20/year.
  - **Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)** — Life insurance cover for ₹436/year.
  - **Atal Pension Yojana (APY)** — Guaranteed monthly pension for unorganized sector workers.
  - **PMAY (Urban/Gramin)** — Subsidized housing credit and assistance.
  - **PMMY (Mudra Loans)** — Collateral-free micro-business financing.

### 3. ⚠️ Scam & Predatory Fraud Detection
- Checks suspicious messages, loan offers, and SMS prompts against known financial fraud vectors.
- Flags predatory lending apps, advance-fee lottery scams, fake KYC alerts, and "digital arrest" authority impersonation threats with clear warnings and the national cybercrime helpline (**1930**).

### 4. 📈 36-Month Monte Carlo Wealth Simulation
- Pure mathematical simulation running **1,000 stochastic iterations across 36 months**.
- Compares three distinct trajectories:
  - **Status Quo:** Sticking with current habits without adjustments.
  - **Moderate Path:** Small reductions in discretionary expenses + modest savings.
  - **Optimal FinMate Plan:** Accelerated high-cost debt payoff + emergency fund building + target goal investments.
- Evaluates net worth growth and probability of achieving your specific financial goals at their target timeline.

### 5. 🎯 Goal Discovery & Behavioral Action Plan
- Extracts short- and long-term goals (Emergency Fund, Child's Education, Debt Freedom, Vehicle Purchase).
- Generates **Decision Cards** explaining *what to do*, *why it matters*, and *what happens if ignored*.
- Breaks goals down into realistic, bite-sized **daily micro-actions** (e.g. *"Set aside ₹140 today in your bank account"*).

### 6. 🎙️ Full-Duplex Voice Assistant ("Ask FinMate")
- **Browser-Native Speech-to-Text (STT):** Speak your questions naturally in English or Hinglish without leaving the dashboard.
- **Context-Grounded Groq LLM:** FinMate audits your real financial snapshot to explain complex answers. Ask *"Why was my risk score 73.1%?"* and receive a precise mathematical breakdown.
- **Browser-Native Text-to-Speech (TTS):** FinMate speaks answers aloud with natural pacing. Listen to audio explanations or replay them at any time with dedicated message speaker controls.

---

## 🏗️ Architecture & Technology Stack

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
  │  [Credibility Validation]                                              │
  │          │                                                             │
  │          ▼                                                             │
  │  [Parallel Execution Layer via asyncio]                                │
  │     ├── Financial Analysis Engine (Cash Flow & Metrics)                │
  │     ├── Risk Assessment Engine (Multi-Pillar Scoring)                  │
  │     ├── Scam Detection Agent (FAISS + Heuristics)                      │
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

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Recharts, Lucide Icons, W3C Web Speech API (STT & TTS) |
| **Gateway Server** | Express, Node.js, TypeScript, Prisma ORM, PostgreSQL |
| **AI Agent Service**| Python 3.11, FastAPI, LangGraph, Groq Cloud LLM (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`) |
| **RAG & Search** | FAISS vector store, SentenceTransformers (`paraphrase-multilingual-MiniLM-L12-v2`) |
| **Simulation** | NumPy, SciPy (1,000 iterations × 36 months) |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.11+
- **uv** (recommended: `curl -LsSf https://astral.sh/uv/install.sh | sh`) or `pip`

---

### 2. Configure Environment Variables

**Agents Service** (`backend/agents/.env`):
```env
# Groq API Key (Powers Chat, Explainability, Coach, and Accessibility)
GROQ_API_KEY=your_groq_api_key_here
GROQ_CHAT_MODEL=openai/gpt-oss-120b
GROQ_MODEL=openai/gpt-oss-120b

# Knowledge Base & Vector Store
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

### 3. Ingest Knowledge Base Indexes (First Time Only)

Pre-embed the 20 regulatory, financial literacy, scheme, and scam markdown documents into FAISS vector stores:
```bash
cd backend/agents
uv run python -m rag.ingest
```

---

### 4. Start the Services

**Terminal 1 — Python Agent Service (FastAPI):**
```bash
cd backend/agents
uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Express Gateway:**
```bash
cd backend/server
npm install
npm run dev
```

**Terminal 3 — Frontend Client:**
```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser to start using FinMate!

---

## 🧪 Testing & Verification

- **Frontend Build Check:**
  ```bash
  cd frontend && npm run build
  ```
- **Backend Contract Tests:**
  ```bash
  cd backend/agents && uv run pytest tests/
  ```
- **Live Health Endpoint:**
  ```bash
  curl http://127.0.0.1:8000/
  curl http://127.0.0.1:8000/health/rag
  ```

---

## 🔒 Privacy & Safety Principles

1. **No Data Selling:** User financial inputs are processed strictly to generate immediate recommendations.
2. **Local Voice Processing:** Speech-to-text recognition occurs directly in the user’s browser via the Web Speech API.
3. **No Hallucinated Numbers:** Decision cards and simulations are strictly grounded in deterministic arithmetic—AI never invents balances or interest rates.

---

## 📄 License
This project is licensed under the MIT License.
