# FinanceBuddy Launch Instructions

Complete setup guide from cloning to running the full application.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Git** (for cloning the repository)
- **Python 3.13.7+** (for Django backend)
- **Node.js 18+** and **npm** (for Vite frontend)
- **PostgreSQL 14+** (database)
- **A Twelve Data API key** (for financial data -[twelvedata.com](https://twelvedata.com))
- **OPENAI_API_KEY** (FOR FINANCEBUDDY CHAT BOT)
- **Secret_key**

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
#
Secret key

SECRET_KEY = yoursecretkey
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/financebuddy

# Twelve Data API (for stock/financial data)
TWELVEDATA_API_KEY=your_twelvedata_api_key_here
# Open AI API KEY
OPENAI_API_KEY = your
# Frontend API Configuration
VITE_API_URL=/api
VITE_API_BASE=http://localhost:8000
```





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

### Terminal 1 - Backend:
```bash
cd FinanceBuddy
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

### Terminal 2 - Frontend:
```bash
cd FinanceBuddy/frontend
npm run dev
```

### Access Points:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

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

## Project Structure Overview

```
FinanceBuddy/
├── accounts/          # User authentication app
├── api/               # API endpoints
├── BE1/               # Additional backend module
├── config/            # Django project settings
├── eurocalc/          # Euro calculator module
├── frontend/          # Vite + TypeScript frontend
├── optnstrdr/         # Options trader module
├── templates/         # Django HTML templates
├── .gitignore
├── db_seed.sql        # Database seed data
├── docker-compose.yml # Docker configuration
├── manage.py          # Django management script
├── package.json       # Root package.json
├── requirements.txt   # Python dependencies
└── test_baw.py        # Test file
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

### Twelve Data API Issues

- Verify your API key is valid at [twelvedata.com](https://twelvedata.com)
- Check API rate limits (free tier has limitations)

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

## Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Vite Documentation](https://vitejs.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Twelve Data API Docs](https://twelvedata.com/docs)
