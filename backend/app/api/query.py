from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import structlog

from app.core.database import get_db
from app.models.schemas import QueryRequest, QueryResponse, ErrorResponse
from app.services.query_service import execute_query_pipeline, stream_query_pipeline

logger = structlog.get_logger()
router = APIRouter(prefix="/query", tags=["query"])


@router.post(
    "/",
    response_model=QueryResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def run_query(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Convert a natural language question into SQL, execute it, and return results.
    Supports conversation history for follow-up questions.
    Includes an agentic retry loop on SQL errors.
    """
    logger.info(
        "Query received",
        question=request.question[:100],
        provider=request.model_provider,
        session_id=request.session_id,
    )
    try:
        response = await execute_query_pipeline(request, db)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error("Unexpected query error", error=str(e))
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


@router.post("/stream/")
async def run_query_stream(request: QueryRequest, db: Session = Depends(get_db)):
    """
    Same as POST /query/ but streams progress events via Server-Sent Events.
    Events: status | sql | result | done | error
    """
    logger.info(
        "Stream query received",
        question=request.question[:100],
        provider=request.model_provider,
    )

    async def generator():
        async for chunk in stream_query_pipeline(request, db):
            yield chunk

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
