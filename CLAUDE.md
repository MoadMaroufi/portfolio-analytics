# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload          # runs on http://localhost:8000

# Tests
pytest tests/ -v                   # all tests
pytest tests/test_api.py::test_single_ticker_rejected -v  # single test
```

### Frontend
```bash
cd frontend
npm install
npm run dev                        # runs on http://localhost:3000
npm run build                      # production build
```

Frontend expects the backend at `http://localhost:8000` by default. Override with `NEXT_PUBLIC_API_URL` env var.

## Architecture

Two fully independent services with no shared code:

**Backend (`backend/main.py`)** — a single FastAPI file with one endpoint: `POST /analyze`. It accepts `{ weights: { "AAPL": 50, "MSFT": 50 } }`, normalizes weights, fetches 1 year of daily closes from Yahoo Finance via `yfinance`, then computes and returns annualized return, volatility, Sharpe ratio (5% risk-free rate), max drawdown, and a correlation matrix. All logic lives in `main.py` — no services or modules.

**Frontend (`frontend/`)** — Next.js App Router, single-page app. `app/page.tsx` owns all state (ticker rows, results, loading/error) and is the only place the `/analyze` API is called. Components are presentational only — `TickerInput`, `MetricCard`, `AuthButton`, `PortfolioManager`. The `CorrelationTable` is inlined in `page.tsx` since it's small.

**Auth & persistence** — Firebase is lazy-initialized in `lib/firebase.ts` (avoids SSR issues since env vars aren't available at build time). `lib/useAuth.ts` wraps Firebase auth state. `lib/portfolios.ts` handles Firestore CRUD under `users/{uid}/portfolios`. The `PortfolioManager` component only renders when a user is signed in.

## Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Deployment

- Frontend → Vercel (set `NEXT_PUBLIC_API_URL` to Railway backend URL)
- Backend → Railway (Dockerfile at `backend/Dockerfile`)
- CI → GitHub Actions runs `pytest backend/tests/ -v` on every push to `main`
