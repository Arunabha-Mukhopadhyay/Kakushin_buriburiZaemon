# ArthSaathi

ArthSaathi is a financial guidance application for users in India. It combines deterministic financial calculations, risk analysis, scam-pattern retrieval, government-scheme matching, future simulations, explainable recommendations, and an optional voice assistant into one workflow.

This README is intended to be a complete handoff document for another engineer or coding agent. It describes the repository as it currently exists, including the boundaries between services, the data contracts, local setup, testing, and known implementation gaps.

> **Important:** ArthSaathi provides educational analysis and modeled scenarios. It must not be presented as guaranteed investment, lending, insurance, tax, or legal advice.

## Product Summary

The user-facing workflow is:

1. The user enters a basic financial profile in the React frontend.
2. The frontend either returns a local mock response or sends the profile to the Python agent service.
3. The Python service validates the payload with Pydantic.
4. A LangGraph workflow computes credibility, financial metrics, risk, scam matches, government-scheme matches, goals, simulations, explanations, an action plan, and an accessible final response.
5. The frontend renders the result as a dashboard with financial metrics, risk factors, modeled scenarios, scam alerts, scheme matches, goals, explanations, action items, chat answers, and optional voice access.
6. The Express server supplies a short-lived ElevenLabs signed URL for the voice experience.

## Repository Layout

```text
.
├── README.md
├── backend/
│   ├── agents/                         # Python FastAPI + LangGraph service
│   │   ├── main.py                     # FastAPI entry point and /analyze endpoint
│   │   ├── graph.py                    # LangGraph orchestration
│   │   ├── state.py                    # Pydantic input and shared TypedDict state
│   │   ├── credibility.py              # Deterministic pre-flight credibility checks
│   │   ├── agents/                     # Individual pipeline agents
│   │   ├── rag/                        # FAISS ingestion and retrieval
│   │   │   └── indexes/                # Generated FAISS index and metadata files
│   │   ├── simulation/                 # Monte Carlo simulation logic
│   │   ├── tests/                      # Python pytest suite
│   │   └── pyproject.toml              # Python dependencies and project metadata
│   ├── knowledge_base/                 # Markdown source documents for RAG
│   │   ├── financial_literacy/
│   │   ├── government_schemes/
│   │   ├── rbi_regulatory/
│   │   └── scam_patterns/
│   └── server/                         # TypeScript Express + Prisma service
│       ├── src/index.ts                # Express entry point
│       ├── src/routes/voice.ts         # ElevenLabs signed URL endpoint
│       ├── src/lib/prisma.ts           # Prisma client setup
│       ├── prisma/schema.prisma        # PostgreSQL data model
│       ├── prisma/migrations/          # Database migrations
│       ├── package.json
│       └── tsconfig.json
└── frontend/                           # React + Vite application
    ├── src/App.jsx                    # Main screens and dashboard components
    ├── src/services/api.js             # Analysis and voice API clients
    ├── src/mocks/analysisResponse.js   # Demo-mode analysis response
    ├── src/utils/format.js             # Display formatting helpers
    ├── src/styles.css                  # Application styles
    ├── index.html
    └── package.json
```

## Architecture

### Services

| Service | Technology | Default URL | Responsibility |
|---|---|---:|---|
| Frontend | React, Vite, Recharts, Lucide | `http://localhost:5173` | Onboarding form, dashboard, mock/live analysis client, chat UI, voice UI |
| Agent service | Python, FastAPI, LangGraph | `http://localhost:8000` | Validates profiles and runs the financial-analysis graph |
| API/server | TypeScript, Express, Prisma | `http://localhost:5000` in code | Voice-token proxy and future persistence/API boundary |
| Database | PostgreSQL | configured by `DATABASE_URL` | Relational users, profiles, goals, results, conversations, and audit records |
| Retrieval | FAISS + Sentence Transformers | local files | Domain-separated semantic retrieval from the Markdown knowledge base |
| Voice provider | ElevenLabs Conversational AI | external | Browser voice session reached through a server-generated signed URL |

The frontend's current default for `VITE_SERVER_BASE_URL` is `http://localhost:3001`, while the Express source defaults to port `5000`. Set the frontend variable explicitly when running the Express server with its current code.

### Agent graph

The Python graph in `backend/agents/graph.py` currently contains ten nodes:

```text
START
  |
  v
Credibility Engine
  |
  +--> Financial Analysis --------+
  +--> Risk Assessment -----------+
  +--> Scam Detection -------------+  (parallel via asyncio.gather)
  +--> Government Scheme Matching -+
  +--> Goal Discovery -------------+
  |
  v
Future Simulation
  |
  v
Explainability
  |
  v
Coach
  |
  v
Accessibility
  |
  v
END
```

The code comments and API description sometimes call this a “9-agent” pipeline. The current implementation has one credibility node, five concurrent agents, and four sequential agents: ten graph nodes in total. Treat `graph.py` as the source of truth.

#### Parallel layer

These five agents run concurrently with `asyncio.gather`, so the layer's wall-clock time is approximately the slowest agent rather than the sum of all five:

- **Financial Analysis:** deterministic monthly surplus, DTI, emergency runway, savings, and income-volatility metrics.
- **Risk Assessment:** deterministic composite risk score, category, and factor breakdown.
- **Scam Detection:** semantic retrieval from the `scam_patterns` FAISS store when suspicious text is supplied.
- **Government Scheme Matching:** profile-based matching against the `government_schemes` store.
- **Goal Discovery:** extracts structured financial goals from the user message.

#### Sequential layer

- **Future Simulation:** NumPy/Monte Carlo-style scenario calculations for status quo, moderate, and optimal paths.
- **Explainability:** turns computed outputs into decision cards using the configured Google model.
- **Coach:** creates prioritized, practical next actions.
- **Accessibility:** produces the final language-adapted response.

The intended boundary is that Python owns numeric computation and LLM-backed agents narrate or structure recommendations. Do not let an LLM replace the deterministic financial calculations or simulation math.

## Data Flow and Contracts

### Analysis request

`POST http://localhost:8000/analyze` accepts JSON matching `FinancialProfileInput` in `backend/agents/state.py`.

Minimal request:

```json
{
  "userId": "demo-user-001",
  "monthlyIncome": 50000,
  "monthlyExpenses": 30000
}
```

A fuller request looks like:

```json
{
  "userId": "demo-user-001",
  "monthlyIncome": 50000,
  "monthlyExpenses": 30000,
  "monthlyEmi": 5000,
  "existingSavings": 80000,
  "existingDebt": 150000,
  "dependents": 2,
  "employmentType": "salaried",
  "age": 31,
  "gender": "female",
  "state": "Maharashtra",
  "isRural": false,
  "casteCategory": "general",
  "landHoldingAcres": null,
  "businessType": null,
  "hasBankAccount": true,
  "hasInsurance": false,
  "hasHealthInsurance": false,
  "riskAppetite": "moderate",
  "preferredLang": "en",
  "suspiciousInput": "You won a prize. Pay a processing fee to claim it.",
  "userMessage": "I want to build an emergency fund in two years."
}
```

Validation rules include:

- `userId` is required.
- `monthlyIncome` must be greater than zero.
- `monthlyExpenses`, `monthlyEmi`, `existingSavings`, and `existingDebt` cannot be negative.
- `dependents` must be zero or greater.
- `age`, when supplied, must be between 1 and 120.
- Optional demographic, scam, and goal fields may be null.

The response shape is:

```json
{
  "userId": "demo-user-001",
  "latencyMs": 1234,
  "credibilityScore": 92.0,
  "credibilityFlags": [],
  "financialMetrics": {
    "monthly_surplus": 15000,
    "dti_ratio": 0.1,
    "emergency_months": 2.67,
    "income_volatility": false,
    "annual_income": 600000
  },
  "riskScore": 42.0,
  "riskCategory": "moderate",
  "riskBreakdown": {},
  "scamFlags": [],
  "eligibleSchemes": [],
  "goals": [],
  "simulationPaths": {},
  "decisionCards": [],
  "actionPlan": [],
  "finalResponse": "..."
}
```

The exact nested fields are defined by `backend/agents/state.py` and the individual agents. Preserve the existing camelCase top-level response keys because the frontend consumes them directly.

### Health endpoints

Python agent service:

```text
GET /
GET /health/rag
```

Expected examples:

```json
{"status":"ok","service":"ArthSaathi Agent API"}
```

`GET /health/rag` reports loaded and missing stores. FAISS indexes are preloaded during FastAPI startup.

Express server:

```text
GET /
GET /api/voice/token
```

The voice endpoint returns:

```json
{"signed_url":"https://..."}
```

The ElevenLabs API key is used only by Express. It is never sent to the browser.

## Local Setup

### Prerequisites

- Windows, macOS, or Linux
- Python `>=3.11,<3.13`
- Node.js compatible with the installed Vite, TypeScript, and Prisma versions
- PostgreSQL if using the Prisma persistence layer
- A Google Generative AI API key for LLM-backed agents
- ElevenLabs credentials only if testing voice
- Enough disk and memory for the multilingual Sentence Transformers model and FAISS indexes

### 1. Clone and enter the repository

```bash
git clone <repository-url>
cd Kakushin_buriburiZaemon
```

### 2. Configure the Python service

Create `backend/agents/.env`:

```dotenv
GOOGLE_API_KEY=your_google_api_key
KNOWLEDGE_BASE_PATH=../knowledge_base
FAISS_INDEX_PATH=./rag/indexes
```

The code calls `load_dotenv()`, so environment files can also be placed where the active process can discover them. Do not commit real credentials.

Install the Python project. The repository declares dependencies in `backend/agents/pyproject.toml`; use the package manager preferred by the team. With `uv`:

```bash
cd backend/agents
uv sync
```

With a standard virtual environment:

```bash
cd backend/agents
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install "fastapi>=0.115.0" "uvicorn[standard]>=0.30.0" "langgraph==0.2.69" "langchain-core>=0.3.23,<0.4.0" "langchain-google-genai>=2.0.0" "sentence-transformers>=2.7.0" "faiss-cpu>=1.7.4" "numpy>=1.26.0,<2.0.0" "scipy>=1.13.0" "python-dotenv>=1.0.0" "pydantic>=2.8.0" "httpx>=0.27.0"
pip install "pytest>=8.0.0" "pytest-asyncio>=0.23.0"
```

If the FAISS metadata files are absent or stale, build the indexes from the Markdown knowledge base:

```bash
cd backend/agents
python -m rag.ingest
```

The ingestion command creates one `.faiss` file and one `.pkl` metadata file for each of these stores:

- `financial_literacy`
- `rbi_regulatory`
- `government_schemes`
- `scam_patterns`

Start the agent API from `backend/agents`:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The first startup may download and load `paraphrase-multilingual-MiniLM-L12-v2`. The FastAPI lifespan preloads the model and all available FAISS stores.

### 3. Configure and start the Express server

Create `backend/server/.env`:

```dotenv
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/arthsaathi
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
```

`DATABASE_URL` is required by Prisma configuration and the Prisma client. ElevenLabs variables are required only for `GET /api/voice/token`.

Install dependencies and generate the Prisma client:

```bash
cd backend/server
npm install
npm run db:generate
```

Apply migrations to a development PostgreSQL database:

```bash
npm run db:migrate
```

For a schema push without creating a migration:

```bash
npm run db:push
```

Start the server:

```bash
npm run dev
```

The current Express source defaults to port `5000` if `PORT` is not set.

Useful database commands:

```bash
npm run db:studio   # Open Prisma Studio
npm run db:reset    # Destructive development reset; do not use casually
npm run build      # Compile TypeScript to dist/
npm start          # Run the compiled server
```

### 4. Configure and start the frontend

Create `frontend/.env` for live mode:

```dotenv
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000
VITE_SERVER_BASE_URL=http://localhost:5000
```

Install and run:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

By default, `VITE_USE_MOCK` is treated as enabled unless it is exactly `false`. Demo mode is useful when the Python service, Google API key, FAISS model, or database is not available. In mock mode, the frontend does not call the analysis API.

## Running Tests and Checks

### Python tests

From `backend/agents`:

```bash
pytest
```

Useful focused runs:

```bash
pytest tests/test_financial_analysis.py
pytest tests/test_monte_carlo.py
pytest tests/test_graph_integration.py
pytest -q
```

### TypeScript server

From `backend/server`:

```bash
npm run build
```

There is currently no server test script in `package.json`.

### Frontend

From `frontend`:

```bash
npm run build
npm run preview
```

There is currently no frontend test or lint script in `package.json`.

## PostgreSQL Data Model

The Prisma schema is in `backend/server/prisma/schema.prisma`. It separates durable relational state from local vector retrieval.

Main entities:

- `User`: identity, preferred language, and relationships to all user-level outputs.
- `FinancialProfile`: income, expenses, debt, savings, demographics, insurance, and risk preference.
- `Goal`: target amount, date or horizon, priority, and status.
- `RiskAssessment`: computed risk score, category, factors, and summary.
- `ScamAlert`: submitted text, flag, confidence, type, and matched pattern IDs.
- `SchemeMatch`: eligibility, annual benefit, eligibility gap, application guidance, and source document IDs.
- `SimulationResult`: scenario, success probability, projected value, percentiles, horizon, and raw output.
- `AgentRun`: input/output audit trail, latency, status, agent name, and optional session.
- `ConversationSession`: language and conversation lifecycle.
- `Message`: narrated user, assistant, or system content.

The schema deliberately does not store embeddings or FAISS indexes. Those remain file-based under `backend/agents/rag/indexes`.

## RAG Knowledge Base

The knowledge base is split into four stores and should remain domain-separated:

| Store | Primary consumers | Content |
|---|---|---|
| `financial_literacy` | Financial Analysis, Coach | Emergency funds, budgeting, savings, mutual funds, insurance, debt |
| `rbi_regulatory` | Risk Assessment, Explainability | Consumer protection, payments, lending, KYC, NBFC/microfinance |
| `government_schemes` | Scheme Matching | PMJDY, MUDRA, APY, PMSBY/PMJJBY, PMAY, NPS, PM Kisan, SVANidhi, and others |
| `scam_patterns` | Scam Detection | Common scams, social engineering, investment scams, gig/rural scams |

Ingestion behavior:

- Markdown files are split around headings.
- Long sections are chunked with overlap.
- Chunks are embedded with `paraphrase-multilingual-MiniLM-L12-v2`.
- FAISS `IndexFlatL2` indexes are generated with matching pickle metadata.
- Lower L2 distance means a more similar result.

When adding or changing knowledge-base documents, rebuild the affected indexes and verify `/health/rag` before testing retrieval-dependent agents.

## Frontend Behavior

The main screens in `frontend/src/App.jsx` are:

- **Welcome:** product entry point.
- **Onboarding:** three-step financial profile form.
- **Loading:** analysis progress state.
- **Dashboard:** overview, risk, simulation, scams, schemes, goals, narrative, coach plan, and local question answering.
- **Voice:** temporary ElevenLabs WebSocket conversation.

The local chatbot does not call an LLM. It uses keyword matching against the current analysis and answers questions about surplus, risk, emergency runway, scam alerts, schemes, goals, scenarios, income, and expenses.

## API and Port Configuration

There are two backend boundaries today:

1. The frontend sends analysis requests directly to the Python service using `VITE_API_BASE_URL`.
2. The frontend requests voice tokens from the Express server using `VITE_SERVER_BASE_URL`.

The Express server does not currently proxy `/analyze`, and the Python service does not currently persist results to Prisma. Treat persistence and API unification as future work unless the implementation is changed.

Recommended local ports:

```text
Frontend: 5173
Python agents: 8000
Express server: 5000
PostgreSQL: 5432
```

## Security and Privacy Notes

- Never commit `.env` files or API keys.
- Keep Google and ElevenLabs credentials server-side.
- Restrict FastAPI CORS origins before production; it currently allows all origins.
- Add authentication and authorization before exposing user records or agent runs.
- Validate and sanitize user-provided scam text and messages at service boundaries.
- Do not treat retrieved documents as automatically current legal or scheme guidance; add source dates and official-source verification for production.
- Avoid exposing raw internal prompts, model errors, secrets, or unfiltered database records to clients.
- `npm run db:reset` deletes development database state and should never be used against production.

## Current Limitations and Handoff Notes

- The Python service is the working analysis API. The Express service currently focuses on voice-token generation and contains the Prisma foundation, but the analysis route is not wired through it.
- Prisma models are present, but the shown request flow does not write analysis results into the database.
- The frontend defaults to mock mode. Live integration requires `VITE_USE_MOCK=false` and a reachable Python service.
- The frontend default server port (`3001`) does not match the Express source default (`5000`); configure `VITE_SERVER_BASE_URL` explicitly.
- CORS is permissive in both backend services and should be narrowed for deployment.
- FAISS retrieval depends on both `.faiss` and `.pkl` files. Rebuilding only one side can produce invalid or mismatched retrieval results.
- The API description says “9-agent” in places, but the graph currently implements ten nodes. Update naming consistently if this matters to external documentation or judging.
- There is no root workspace package manager configuration or single-command orchestration script. Start each service from its own directory.
- Automated tests are concentrated in the Python agents. Server and frontend currently rely on build checks and manual verification.

## Suggested Development Workflow

1. Start with mock mode to verify the frontend screens and interactions.
2. Run the Python unit tests before changing calculation or agent behavior.
3. Make deterministic calculation changes in the relevant Python agent and update its focused test.
4. Make prompt or narrative changes only in the LLM-backed agent that owns that output.
5. Rebuild FAISS indexes after knowledge-base changes.
6. Check `GET /health/rag` and `POST /analyze` with a small known profile.
7. Run `npm run build` in both `backend/server` and `frontend`.
8. Test voice separately because it requires valid ElevenLabs credentials and an external WebSocket.

## Guidance for Claude or Another Coding Agent

When modifying this project:

- Read `backend/agents/state.py` before changing request or response fields.
- Read `backend/agents/graph.py` before adding or reordering pipeline stages.
- Keep numeric truth in deterministic Python code and keep narration in the LLM-backed stages.
- Preserve the four RAG store boundaries; do not merge unrelated domains into one index.
- Preserve the frontend's current top-level response key names unless all consumers are updated together.
- Update or add focused Python tests for calculation, simulation, retrieval, and graph changes.
- Use the Prisma schema as the source of truth for persistence changes and create migrations for committed schema changes.
- Never infer missing credentials from `.env` contents or include secrets in logs, documentation, test fixtures, or commits.
- Check for existing uncommitted user changes before editing and avoid overwriting unrelated work.

## License and Project Status

The package metadata currently uses the ISC license for the Express server, while no repository-wide license declaration is present. Confirm the intended project license before publishing or distributing the complete application.

ArthSaathi is an active prototype/hackathon-style system. Treat calculations, scheme eligibility, retrieved regulatory material, and model-generated explanations as inputs to review rather than authoritative financial promises.
