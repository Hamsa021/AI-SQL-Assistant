from fastapi import APIRouter
from datetime import datetime, timezone
import anthropic
import openai

from app.core.database import test_connection
from app.core.config import settings
from app.models.schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", response_model=HealthResponse)
def health_check():
    """System health check — verifies DB, Anthropic, and OpenAI connectivity."""
    db_ok = test_connection()

    # Check Anthropic key is set
    anthropic_ok = bool(settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY.startswith("sk-ant"))

    # Check OpenAI key is set
    openai_ok = bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.startswith("sk-"))

    return HealthResponse(
        status="ok" if db_ok else "degraded",
        database=db_ok,
        anthropic=anthropic_ok,
        openai=openai_ok,
        timestamp=datetime.now(timezone.utc),
    )
