# AI SQL Assistant

A production-ready AI-powered SQL assistant that converts natural language questions into SQL queries, executes them, explains the results, and visualizes the data — powered by **Anthropic Claude** and **OpenAI GPT-4o**.

![Stack](https://img.shields.io/badge/Stack-React%20%2B%20FastAPI%20%2B%20PostgreSQL-blue)
![AI](https://img.shields.io/badge/AI-Claude%20%2B%20GPT--4o-purple)

---

## Features

| Category | Feature |
|---|---|
| **UI** | ChatGPT-like interface, dark/light mode, query history sidebar |
| **Results** | SQL display with syntax highlighting, paginated data tables, bar/line/pie charts |
| **AI** | Natural language → SQL, plain-English explanations, conversation memory, follow-up questions |
| **Agentic** | Self-correcting retry loop on SQL errors (up to 3 retries) |
| **Security** | Read-only DB, blocks DROP/DELETE/UPDATE/INSERT/TRUNCATE/ALTER, SQL validation, rate limiting |
| **Models** | Switch between Claude Sonnet 4 and GPT-4o from the UI |
| **Observability** | Structured logging, query audit log, health endpoint |

---

## Project Structure

```
ai-sql-assistant/
├── .env.example               # Root env template
├── .gitignore
├── docker-compose.yml         # Orchestrates frontend, backend, postgres
├── setup.sh                   # One-shot local setup script
├── README.md
│
├── backend/                   # Python FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── app/
│       ├── main.py            # FastAPI app entry point
│       ├── api/
│       │   ├── health.py      # GET /api/v1/health/
│       │   ├── history.py     # GET/DELETE /api/v1/history/
│       │   ├── query.py       # POST /api/v1/query/
│       │   └── schema.py      # GET /api/v1/schema/
│       ├── core/
│       │   ├── config.py      # Settings via pydantic-settings
│       │   ├── database.py    # SQLAlchemy engine + session
│       │   └── logging.py     # structlog configuration
│       ├── models/
│       │   ├── query_log.py   # SQLAlchemy ORM model
│       │   └── schemas.py     # Pydantic request/response schemas
│       ├── services/
│       │   ├── ai_service.py      # Claude + GPT-4o integration
│       │   ├── query_service.py   # Query execution + retry loop
│       │   └── schema_service.py  # DB schema introspection
│       └── utils/
│           └── sql_validator.py   # SELECT-only validation + blocklist
│   └── tests/
│       └── test_sql_validator.py
│
├── frontend/                  # React + Vite + TypeScript + Tailwind
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── components/
│       │   ├── chat/
│       │   │   ├── ChatView.tsx          # Main chat container
│       │   │   ├── ChatInput.tsx         # Message input + submit
│       │   │   ├── MessageBubble.tsx     # User/AI message renderer
│       │   │   ├── SqlBlock.tsx          # Syntax-highlighted SQL
│       │   │   └── ThinkingIndicator.tsx # AI loading animation
│       │   ├── charts/
│       │   │   └── ChartDisplay.tsx      # Bar / line / pie via Recharts
│       │   ├── results/
│       │   │   └── ResultsTable.tsx      # Paginated data table
│       │   ├── sidebar/
│       │   │   └── HistorySidebar.tsx    # Query history list
│       │   └── ui/
│       │       ├── TopBar.tsx            # Nav + model switcher + theme
│       │       ├── SchemaModal.tsx       # DB schema viewer
│       │       └── HealthModal.tsx       # Backend health status
│       ├── store/
│       │   └── useStore.ts              # Zustand global state
│       ├── types/
│       │   └── index.ts                 # Shared TypeScript interfaces
│       └── utils/
│           └── api.ts                   # Axios API client
│
└── database/
    └── init.sql               # Sample e-commerce schema + seed data
```

---

## Quick Start (Local — No Docker)

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ running locally
- Anthropic API key and/or OpenAI API key

---

### 1. Clone & enter the project

```bash
git clone <repo-url>
cd ai-sql-assistant
```

---

### 2. Set up the database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE sql_assistant;"

# Load sample schema and seed data
psql -U postgres -d sql_assistant -f database/init.sql
```

---

### 3. Configure the backend

```bash
cd backend
cp ../.env.example .env
```

Edit `.env` and fill in:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/sql_assistant
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

---

### 4. Install backend dependencies & run

```bash
# From the backend/ directory
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --port 8000
```

Backend available at: http://localhost:8000  
API docs at: http://localhost:8000/docs

---

### 5. Install frontend dependencies & run

```bash
# From the frontend/ directory (new terminal)
cd ../frontend
npm install
npm run dev
```

Frontend available at: http://localhost:5173

---

## Quick Start (Docker Compose)

```bash
# Copy and fill env file first
cp .env.example backend/.env
# Edit backend/.env with your API keys

# Start everything
docker compose up --build

# Or in background
docker compose up --build -d
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Postgres: localhost:5432

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/query/` | Run a natural language query |
| `GET` | `/api/v1/schema/` | Get full database schema |
| `GET` | `/api/v1/history/` | Get query history |
| `DELETE` | `/api/v1/history/{id}` | Delete a history entry |
| `GET` | `/api/v1/health/` | System health check |

### Query Request Body

```json
{
  "question": "Show me top 10 customers by revenue",
  "model_provider": "anthropic",
  "conversation_history": [],
  "session_id": "optional-uuid"
}
```

### Query Response

```json
{
  "session_id": "uuid",
  "sql": "SELECT ...",
  "explanation": "This query returns...",
  "columns": ["name", "revenue"],
  "rows": [["Alice", 4200.00]],
  "row_count": 10,
  "chart_recommendation": {
    "type": "bar",
    "x_column": "name",
    "y_column": "revenue",
    "title": "Top Customers by Revenue"
  },
  "execution_time_ms": 38.4,
  "model_used": "claude-sonnet-4-20250514",
  "retries": 0
}
```

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## Security Notes

- All queries are validated before execution — only `SELECT` is allowed
- Blocked keywords: `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, `REVOKE`
- Multiple statements (`;` separated) are blocked
- Rate limiting: 20 requests/minute per IP (configurable in `.env`)
- All queries are logged to `query_logs` table for auditing
- Secrets are loaded from `.env` — never hard-coded

---

## Adding Your Own Database

1. Update `DATABASE_URL` in `.env` to point to your database
2. The schema is auto-extracted — no configuration needed
3. Restart the backend

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Zustand, Recharts |
| Backend | Python 3.12, FastAPI, SQLAlchemy, Pydantic v2 |
| Database | PostgreSQL 16 |
| AI | Anthropic Claude Sonnet 4, OpenAI GPT-4o |
| Infrastructure | Docker, Docker Compose |
| Observability | structlog, SQLAlchemy query logs |
