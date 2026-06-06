#!/usr/bin/env bash
# setup.sh — bootstrap the AI SQL Assistant for local development
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✔]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✘]${NC} $1"; exit 1; }

echo ""
echo "══════════════════════════════════════════"
echo "   AI SQL Assistant — Local Setup Script  "
echo "══════════════════════════════════════════"
echo ""

# ── Check prerequisites ──────────────────────────────────────────────────────
command -v python3 >/dev/null 2>&1 || error "python3 is required"
command -v node    >/dev/null 2>&1 || error "node is required (v20+)"
command -v npm     >/dev/null 2>&1 || error "npm is required"
command -v psql    >/dev/null 2>&1 || error "psql (PostgreSQL client) is required"
info "Prerequisites OK"

# ── Copy .env ────────────────────────────────────────────────────────────────
if [ ! -f backend/.env ]; then
  cp .env.example backend/.env
  warn "Created backend/.env — please fill in your API keys before running the app"
else
  info "backend/.env already exists"
fi

# ── Database ─────────────────────────────────────────────────────────────────
info "Creating PostgreSQL database..."
psql -U postgres -c "CREATE DATABASE sql_assistant;" 2>/dev/null || warn "Database may already exist — continuing"
psql -U postgres -d sql_assistant -f database/init.sql
info "Database initialised with sample data"

# ── Backend ──────────────────────────────────────────────────────────────────
info "Setting up Python virtual environment..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
info "Backend dependencies installed"
cd ..

# ── Frontend ─────────────────────────────────────────────────────────────────
info "Installing frontend dependencies..."
cd frontend
npm install --silent
info "Frontend dependencies installed"
cd ..

echo ""
echo "══════════════════════════════════════════"
echo "   Setup complete!"
echo ""
echo "   Edit  backend/.env  with your API keys"
echo ""
echo "   Then start the backend:"
echo "   cd backend && source venv/bin/activate"
echo "   uvicorn app.main:app --reload --port 8000"
echo ""
echo "   And the frontend (new terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "   Frontend → http://localhost:5173"
echo "   API docs → http://localhost:8000/docs"
echo "══════════════════════════════════════════"
