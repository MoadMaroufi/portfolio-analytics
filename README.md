# Portfolio Analytics

Portfolio Analytics is a full-stack web application for portfolio risk analysis, allocation optimization, and AI-assisted stock discovery.

It combines a classical portfolio analytics workflow with a semantic discovery workflow: users can analyze an existing allocation, optimize a basket of tickers, or start from a natural-language investment theme and turn the result into a portfolio draft.

The interface is available in English and French.

## What It Does

### Portfolio Analysis

- Computes annualized return, volatility, Sharpe ratio, and maximum drawdown
- Shows cross-asset correlation to highlight concentration and diversification risk
- Uses daily market data from Yahoo Finance

### Portfolio Optimization

- Runs minimum-variance optimization for a selected basket of tickers
- Uses Ledoit-Wolf covariance shrinkage for more stable estimates
- Visualizes a Monte Carlo frontier for risk/return exploration
- Enforces long-only allocations with a configurable per-asset weight cap

### AI-Assisted Discovery

- Supports natural-language prompts such as `"European luxury stocks with pricing power"`
- Retrieves relevant companies from a curated European equity dataset stored in Qdrant
- Returns ranked or LLM-shaped recommendations with weights and rationale
- Lets users apply the recommended weights directly to the portfolio workflow

### User Features

- Google Sign-In via Firebase Auth
- Save, load, and delete named portfolios
- Cache optimization results in Firestore

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 19, Tailwind CSS, Recharts |
| Backend | FastAPI, Poetry, yfinance, numpy, pandas, scipy, scikit-learn |
| Semantic Search | sentence-transformers, Qdrant |
| LLM Layer | NVIDIA AI Foundation Models |
| Auth and Storage | Firebase Auth, Firestore |
| CI | GitHub Actions |
| Hosting | Vercel frontend, Railway backend |

## Application Structure

### Frontend

The frontend exposes two primary routes:

- `/` for portfolio analysis and optimization
- `/discover` for semantic search and AI-generated portfolio suggestions

### Backend

The backend currently exposes three endpoints:

- `POST /analyze`
- `POST /optimize`
- `POST /semantic-search`

Analysis and optimization rely on Yahoo Finance market data. Semantic search relies on a Qdrant collection populated from the local company dataset under `backend/data/`.

## Local Setup

### Backend

```bash
cd backend
poetry install
poetry run uvicorn main:app --reload
```

The API runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

By default, the frontend reads `NEXT_PUBLIC_API_URL`, falling back to `http://localhost:8000`.

## Environment Variables

### Backend

Create `backend/.env`:

```env
PORTFOLIO_RISK_FREE_RATE=0.05
PORTFOLIO_DATA_PERIOD=1y
PORTFOLIO_MAX_TICKERS=20
PORTFOLIO_MONTE_CARLO_SAMPLES=2000
PORTFOLIO_MAX_WEIGHT_PER_ASSET=0.4

PORTFOLIO_QDRANT_URL=
PORTFOLIO_QDRANT_API_KEY=
PORTFOLIO_QDRANT_COLLECTION=european_companies
PORTFOLIO_EMBEDDING_MODEL_NAME=BAAI/bge-large-en-v1.5
PORTFOLIO_SEMANTIC_SEARCH_DEFAULT_TOP_K=10
PORTFOLIO_SEMANTIC_SEARCH_MAX_TOP_K=20

PORTFOLIO_NVIDIA_API_KEY=
PORTFOLIO_NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
PORTFOLIO_NVIDIA_MODEL=moonshotai/kimi-k2-instruct-0905
PORTFOLIO_LLM_TEMPERATURE=0.6
PORTFOLIO_LLM_TOP_P=0.9
PORTFOLIO_LLM_MAX_TOKENS=4096

PORTFOLIO_HUGGINGFACE_TOKEN=

PORTFOLIO_CORS_ORIGINS=http://localhost:3000
```

### Frontend

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Semantic Search Reproducibility

This is the main limitation in the current setup.

The repository includes the source files and scripts used to power semantic search, but the deployed cloud stack does not automatically provision that pipeline in a fresh environment. Reproducing the semantic-search feature still requires manual Qdrant setup.

Current workflow:

1. Prepare the company dataset in `backend/data/`
2. Generate embeddings locally
3. Seed a Qdrant collection
4. Point the backend at that Qdrant instance with environment variables

Relevant files:

- `backend/data/build_dataset.py`
- `backend/data/clean_dataset.py`
- `backend/data/companies.json`
- `backend/scripts/seed_qdrant.py`

Example seeding flow:

```bash
cd backend
poetry run python scripts/seed_qdrant.py embed
poetry run python scripts/seed_qdrant.py seed --qdrant-url https://YOUR_QDRANT --api-key YOUR_API_KEY
```

Important notes:

- Portfolio analysis and optimization do not require Qdrant.
- Semantic search does require a populated Qdrant collection.
- The hosted deployment does not currently build, seed, or migrate that collection for new environments.
- This may be pushed into the cloud later, but that is not part of the current deployment model.

## Testing

```bash
cd backend
poetry run pytest tests/ -v
```

## Deployment

### Current Deployment

- Frontend: Vercel
- Backend API: Railway
- CI: GitHub Actions for backend tests on push and pull request

### Current Limitation

The deployed backend is an API service, not a full ingestion pipeline. It does not automatically:

- build or refresh the company dataset
- compute embeddings
- seed Qdrant
- recreate semantic-search infrastructure in a fresh environment

As a result, a new contributor or evaluator can run the core app locally, but full semantic-search reproduction still requires manual setup outside the standard deploy flow.

## Disclaimer

This repository is a personal hobby project for educational purposes.

Nothing in this codebase, UI, analytics output, or AI-generated recommendation should be treated as financial, investment, tax, or legal advice. Market data may be delayed or inaccurate, and generated suggestions may be incomplete or wrong. Anyone using the project is responsible for independently verifying information and making their own decisions.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
