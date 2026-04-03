# Portfolio Analytics

A full-stack portfolio risk analysis and optimization tool. Enter your holdings, get institutional-grade risk metrics and an optimal allocation — powered by Markowitz minimum-variance optimization.

Available in English and French.

## Features

**Risk Analysis**
- Annualized return and volatility
- Sharpe ratio (5% risk-free rate baseline)
- Maximum drawdown
- Correlation matrix with color-coded heatmap

**Portfolio Optimizer**
- Minimum-variance optimization via scipy SLSQP
- Ledoit–Wolf covariance shrinkage for more stable estimates on short histories
- Monte Carlo frontier: 2 000 Dirichlet-sampled portfolios visualized as a risk–return scatter chart
- Long-only constraint with per-asset weight cap
- Results cached per user in Firestore (24h TTL) — no redundant API calls

**AI-Powered Discovery (RAG)**
- Semantic search over 570+ European companies (STOXX Europe 600)
- Natural language queries: "European luxury stocks with pricing power"
- AI-generated portfolio recommendations with weighted allocations
- Integration with portfolio optimizer for seamless workflow

**Authentication & Persistence**
- Google Sign-In via Firebase Auth
- Save, load, and delete named portfolios per user (Firestore)
- Persist optimization results with caching

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, Poetry, yfinance, numpy/pandas, scipy, scikit-learn, sentence-transformers, Qdrant |
| Frontend | Next.js 15 (App Router), Tailwind CSS, Recharts |
| AI/ML | NVIDIA AI Foundation Models, Qdrant vector database, BGE embeddings |
| Auth & DB | Firebase Auth, Firestore |
| CI | GitHub Actions — runs full test suite on every push to `main` |
| Hosting | Frontend → Vercel, Backend → Railway |

## Run locally

**Backend**
```bash
cd backend
poetry install
poetry run uvicorn main:app --reload # http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev # http://localhost:3000
```

The frontend reads `NEXT_PUBLIC_API_URL` for the backend address, defaulting to `http://localhost:8000`.

**Backend environment** — create `backend/.env`:
```
PORTFOLIO_QDRANT_URL=https://your-qdrant-instance.cloud.qdrant.io
PORTFOLIO_QDRANT_API_KEY=your-api-key
PORTFOLIO_QDRANT_COLLECTION=european_companies
PORTFOLIO_NVIDIA_API_KEY=nvapi-xxxxx
PORTFOLIO_HUGGINGFACE_TOKEN=hf_xxxxx
PORTFOLIO_CORS_ORIGINS=http://localhost:3000
```

**Frontend environment** — create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Tests

```bash
cd backend
poetry run pytest tests/ -v
```

12 tests covering input validation, ticker resolution, and optimizer response shape.

## Deploy

- **Frontend** → Vercel: set `NEXT_PUBLIC_API_URL` and all `NEXT_PUBLIC_FIREBASE_*` variables in project settings.
- **Backend** → Railway: `backend/Dockerfile` is production-ready. Uses Poetry for dependency management.
- **Firestore rules** — ensure your security rules cover `users/{uid}/{document=**}` to allow subcollection writes.
