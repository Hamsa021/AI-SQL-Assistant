from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog

from app.core.config import settings
from app.core.database import Base, engine
from app.core.logging import setup_logging
from app.models.query_log import QueryLog  # noqa: F401 — needed for table creation
from app.api import query, schema, history, health

# Setup logging
setup_logging()
logger = structlog.get_logger()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI SQL Assistant",
    description="Natural language to SQL powered by Claude and GPT-4",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info("Request", method=request.method, path=request.url.path)
    response = await call_next(request)
    logger.info("Response", status=response.status_code, path=request.url.path)
    return response


# Apply rate limiting to query endpoint
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    return await call_next(request)


# Include routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(query.router, prefix="/api/v1")
app.include_router(schema.router, prefix="/api/v1")
app.include_router(history.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "AI SQL Assistant API", "docs": "/docs", "version": "1.0.0"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)},
    )
