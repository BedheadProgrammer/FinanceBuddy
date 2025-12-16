# FinanceBuddy Launch Instructions

Complete setup guide from cloning to running the full application.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Git** (for cloning the repository)
- **Python 3.13.7+** (for Django backend)
- **Node.js 18+** and **npm** (for Vite frontend)
- **PostgreSQL 14+** (database)
- **Alpaca API credentials** (primary provider for stocks, options, and crypto — [alpaca.markets](https://alpaca.markets))
- **Twelve Data API key** (secondary provider for additional financial data — [twelvedata.com](https://twelvedata.com))
- **OpenAI API key** (for FinanceBuddy chatbot assistant)

---

## 1. Clone the Repository
```bash
git clone https://github.com/BedheadProgrammer/FinanceBuddy.git
cd FinanceBuddy
```

---

## 2. Environment Variables Setup

Create a `.env` file in the project root with the following variables:
```env
# Django Secret Key
SECRET_KEY=your_django_secret_key_here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/financebuddy

# Alpaca API (primary provider for stocks, options, and crypto)
ALPACA_API_KEY=your_alpaca_api_key_here
ALPACA_SECRET_KEY=your_alpaca_secret_key_here
ALPACA_BASE_URL=https://paper-api.alpaca.markets

# Twelve Data API (secondary provider for additional financial data)
TWELVEDATA_API_KEY=your_twelvedata_api_key_here

# OpenAI API Key (for FinanceBuddy assistant)
OPENAI_API_KEY=your_openai_api_key_here

# Frontend API Configuration
VITE_API_URL=/api
VITE_API_BASE=http://localhost:8000
```

### Obtaining Alpaca API Credentials

1. Sign up for a free account at [alpaca.markets](https://alpaca.markets)
2. Navigate to the **Paper Trading** dashboard
3. Go to **API Keys** and generate a new key pair
4. Copy your **API Key ID** and **Secret Key** to your `.env` file

**Environment URLs:**

| Environment | Base URL | Use Case |
|-------------|----------|----------|
| Paper Trading | `https://paper-api.alpaca.markets` | Development and testing |
| Live Trading | `https://api.alpaca.markets` | Production (real money) |

> **Note:** Alpaca provides commission-free access to US stocks, options, and cryptocurrency. The paper trading environment allows you to test with simulated funds at no cost.

### Alpaca Features Used

FinanceBuddy leverages Alpaca for:

- **Stock Market Data** — Real-time and historical quotes
- **Options Data** — Options chains and pricing
- **Cryptocurrency Trading** — Buy/sell crypto pairs (BTC/USD, ETH/USD, etc.)
- **Fractional Trading** — Support for fractional share and crypto quantities

---

## 3. Database Setup (PostgreSQL)

### Option A: Local PostgreSQL Installation

1. **Install PostgreSQL** (if not already installed):
```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # macOS (with Homebrew)
   brew install postgresql@14
   brew services start postgresql@14

   # Windows
   # Download installer from https://www.postgresql.org/download/windows/
```

2. **Create the database and user**:
```bash
   # Access PostgreSQL shell
   sudo -u postgres psql

   # In the PostgreSQL shell, run:
   CREATE DATABASE financebuddy;
   CREATE USER your_username WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE financebuddy TO your_username;
   \q
```

### Option B: Using Docker (from docker-compose.yml)

If you prefer Docker, the repository includes a `docker-compose.yml`:
```bash
docker-compose up -d db
```

This will start a PostgreSQL container. Update your `DATABASE_URL` accordingly.

---

## 4. Backend Setup (Django)

### 4.1 Create and Activate Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 4.2 Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4.3 Run Database Migrations
```bash
python manage.py migrate
```

### 4.4 (Optional) Seed the Database

If you want to populate the database with initial data:
```bash
# Using the provided seed file
psql $DATABASE_URL -f db_seed.sql

# Or connect and run manually
psql -U your_username -d financebuddy -f db_seed.sql
```

### 4.5 Create a Superuser (Optional)

For admin access:
```bash
python manage.py createsuperuser
```

### 4.6 Start the Django Development Server
```bash
python manage.py runserver
```

The backend will be available at `http://localhost:8000`.

---

## 5. Frontend Setup (Vite + TypeScript)

Open a **new terminal window** (keep the backend running).

### 5.1 Navigate to Frontend Directory
```bash
cd frontend
```

### 5.2 Install Node Dependencies
```bash
npm install
```

### 5.3 Create Frontend Environment File

Create a `.env` file inside the `frontend` directory:
```env
VITE_API_URL=http://localhost:8000
VITE_API_BASE=http://localhost:8000/api
```

### 5.4 Start the Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (default Vite port).

---

## 6. Running the Full Application

You need **two terminal windows** running simultaneously:

### Terminal 1 — Backend:
```bash
cd FinanceBuddy
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

### Terminal 2 — Frontend:
```bash
cd FinanceBuddy/frontend
npm run dev
```

### Access Points:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api |
| Django Admin | http://localhost:8000/admin |

---

## 7. Using Docker Compose (Alternative Full Setup)

For a containerized setup using the provided `docker-compose.yml`:
```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## 8. Application Features

### Portfolio Management

- **Multi-Portfolio Support** — Create and manage multiple portfolios
- **Real-Time Valuations** — Live market prices via Alpaca
- **P/L Tracking** — Track unrealized gains/losses across all positions

### Trading

| Asset Class | Features |
|-------------|----------|
| **Stocks** | Market and limit orders, real-time quotes |
| **Options** | European and American style, Black-Scholes pricing, Greeks calculation |
| **Crypto** | Fractional quantities, market orders, 24/7 trading |

### AI Assistant

- **FinanceBud** — AI-powered portfolio assistant
- Contextual advice based on your holdings
- Powered by OpenAI GPT models

### Options Pricing

- **European Options** — Black-Scholes-Merton model
- **American Options** — Barone-Adesi-Whaley approximation
- **Greeks** — Delta, Gamma, Theta, Vega, Rho calculations

---

## Project Structure Overview
```
FinanceBuddy/
├── accounts/          # User authentication app
├── api/               # REST API endpoints
│   ├── views.py       # Stock and options endpoints
│   └── crypto.py      # Cryptocurrency endpoints
├── config/            # Django project settings
├── eurocalc/          # European options calculator
├── frontend/          # Vite + React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── portfolio/
│   │   │       ├── TradeTabs.tsx
│   │   │       ├── PositionsTabs.tsx
│   │   │       ├── BuyCryptoForm.tsx
│   │   │       └── CryptoPositionsTable.tsx
│   │   ├── hooks/
│   │   │   ├── useCryptoAssets.ts
│   │   │   ├── useCryptoPositions.ts
│   │   │   └── useCryptoTrade.ts
│   │   └── types/
│   │       └── portfolio.ts
├── optnstrdr/         # Options trader module
├── templates/         # Django HTML templates
├── .gitignore
├── db_seed.sql        # Database seed data
├── docker-compose.yml # Docker configuration
├── manage.py          # Django management script
├── requirements.txt   # Python dependencies
└── README.md          # This file
```

---

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check your `DATABASE_URL` format is correct
- Ensure the database and user exist with proper permissions

### Migration Errors
```bash
# Reset migrations if needed
python manage.py migrate --fake-initial

# Or create fresh migrations
python manage.py makemigrations
python manage.py migrate
```

### Frontend Can't Connect to Backend

- Ensure the backend is running on port 8000
- Check CORS settings in Django (`config/settings.py`)
- Verify `VITE_API_URL` and `VITE_API_BASE` are correct

### Alpaca API Issues

- Verify your API key and secret are correct at [app.alpaca.markets](https://app.alpaca.markets)
- Ensure you're using the correct base URL for your environment
- Check if your account has the required permissions (crypto trading must be enabled)
- Paper trading accounts have separate API keys from live accounts

### Twelve Data API Issues

- Verify your API key is valid at [twelvedata.com](https://twelvedata.com)
- Check API rate limits (free tier: 8 requests/minute, 800 requests/day)

### Crypto Trading Not Working

- Ensure `ALPACA_API_KEY` and `ALPACA_SECRET_KEY` are set
- Crypto trading must be enabled on your Alpaca account
- Check that the crypto pair is tradable (e.g., BTC/USD, ETH/USD)

### Port Already in Use
```bash
# Find and kill process on port 8000
lsof -i :8000
kill -9 <PID>

# Or use a different port
python manage.py runserver 8001
```

---

## Quick Start Checklist

- [ ] Clone repository
- [ ] Create `.env` file with all required variables
- [ ] Obtain Alpaca API credentials (paper trading)
- [ ] Obtain Twelve Data API key
- [ ] Obtain OpenAI API key
- [ ] Set up PostgreSQL database
- [ ] Create and activate Python virtual environment
- [ ] Install Python dependencies (`pip install -r requirements.txt`)
- [ ] Run migrations (`python manage.py migrate`)
- [ ] Start Django server (`python manage.py runserver`)
- [ ] Navigate to `frontend/` directory
- [ ] Install Node dependencies (`npm install`)
- [ ] Start Vite dev server (`npm run dev`)
- [ ] Open http://localhost:5173 in your browser

---

## API Endpoints Reference

### Portfolio

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolios/` | List all portfolios |
| POST | `/api/portfolios/create/` | Create new portfolio |
| GET | `/api/portfolio/summary/` | Get portfolio summary with positions |
| POST | `/api/portfolio/trade/` | Execute stock trade |

### Options

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/options/positions/` | List option positions |
| POST | `/api/options/trade/` | Execute option trade |
| POST | `/api/options/exercise/` | Exercise option contract |

### Crypto

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/crypto/assets/` | List tradable crypto assets |
| GET | `/api/crypto/positions/` | List crypto positions |
| POST | `/api/crypto/trade/` | Execute crypto trade |

---

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Vite Documentation](https://vitejs.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Alpaca API Documentation](https://docs.alpaca.markets/)
- [Twelve Data API Documentation](https://twelvedata.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

