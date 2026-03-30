# Portfolio Analytics

Analyze a stock portfolio and get key risk metrics instantly.

Enter your holdings (ticker + weight), and the app computes:
- Annualized return and volatility
- Sharpe ratio
- Max drawdown
- Correlation matrix between assets

Focused on the French market (CAC 40) but works with any Yahoo Finance ticker.

## Stack

- **Backend** — FastAPI + yfinance + numpy/pandas, deployed on Railway
- **Frontend** — Next.js + Tailwind CSS, deployed on Vercel
- **CI** — GitHub Actions runs tests on every push

## Run locally

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend expects the backend at `http://localhost:8000` by default.

## Run tests

```bash
cd backend
pytest tests/ -v
```

## Deploy

Set `NEXT_PUBLIC_API_URL` in your Vercel environment variables to point at your Railway backend URL.
