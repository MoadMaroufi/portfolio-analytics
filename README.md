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

**Authentication & Persistence**
- Google Sign-In via Firebase Auth
- Save, load, and delete named portfolios per user (Firestore)

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, yfinance, numpy/pandas, scipy, scikit-learn |
| Frontend | Next.js 15 (App Router), Tailwind CSS, Recharts |
| Auth & DB | Firebase Auth, Firestore |
| CI | GitHub Actions — runs full test suite on every push to `main` |
| Hosting | Frontend → Vercel, Backend → Railway |

## Run locally

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload   # http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

The frontend reads `NEXT_PUBLIC_API_URL` for the backend address, defaulting to `http://localhost:8000`.

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
pytest tests/ -v
```

12 tests covering input validation, ticker resolution, and optimizer response shape.

## Deploy

- **Frontend** → Vercel: set `NEXT_PUBLIC_API_URL` and all `NEXT_PUBLIC_FIREBASE_*` variables in project settings.
- **Backend** → Railway: `backend/Dockerfile` is production-ready. No additional config required.
- **Firestore rules** — ensure your security rules cover `users/{uid}/{document=**}` to allow subcollection writes.

## Roadmap

- **Multi-period backtesting** — compare optimized allocation vs equal-weight and buy-and-hold benchmarks over custom date ranges
- **Sector exposure breakdown** — show concentration by sector (tech, financials, energy, etc.) alongside ticker-level weights
- **Rebalancing alerts** — notify users when their current portfolio drifts significantly from the optimal allocation
- **PDF report export** — one-click downloadable summary with metrics, frontier chart, and suggested allocation
- **Expanded market coverage** — better support for markets with limited yfinance coverage (Casablanca SE, Gulf exchanges) via alternative data providers
- **Rolling optimization** — show how optimal weights evolve over time as the covariance structure changes
