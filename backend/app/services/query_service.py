import time
import uuid
from typing import List, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
import structlog

from app.models.schemas import (
    QueryRequest,
    QueryResponse,
    Message,
    ChartRecommendation,
    ChartType,
)
from app.models.query_log import QueryLog
from app.services.schema_service import get_schema, schema_to_text
from app.services.ai_service import generate_sql, parse_chart_recommendation
from app.utils.sql_validator import validate_sql, extract_sql_from_response

logger = structlog.get_logger()

MAX_RETRIES = 3


async def execute_query_pipeline(
    request: QueryRequest,
    db: Session,
) -> QueryResponse:
    session_id = request.session_id or str(uuid.uuid4())
    start_time = time.perf_counter()
    retries = 0
    last_error: Optional[str] = None
    sql: str = ""
    explanation: str = ""
    chart_rec = ChartRecommendation(type=ChartType.NONE, title="")
    model_used = ""
    columns: List[str] = []
    rows: List[List[Any]] = []

    # Extract schema
    schema_tables = get_schema(db)
    schema_text = schema_to_text(schema_tables)

    while retries <= MAX_RETRIES:
        try:
            # Call AI to generate SQL
            ai_response, model_used = await generate_sql(
                question=request.question,
                schema_text=schema_text,
                conversation_history=request.conversation_history,
                provider=request.model_provider,
                error_feedback=last_error if retries > 0 else None,
            )

            sql = extract_sql_from_response(ai_response.get("sql", ""))
            explanation = ai_response.get("explanation", "")
            chart_rec = parse_chart_recommendation(ai_response)

            # Validate SQL safety
            is_safe, reason = validate_sql(sql)
            if not is_safe:
                _log_query(db, session_id, request.question, sql, False, reason, 0, model_used, 0)
                raise ValueError(f"SQL validation failed: {reason}")

            # Execute SQL
            columns, rows = _execute_sql(db, sql)

            elapsed_ms = (time.perf_counter() - start_time) * 1000
            _log_query(db, session_id, request.question, sql, True, None, elapsed_ms, model_used, len(rows))

            return QueryResponse(
                session_id=session_id,
                sql=sql,
                explanation=explanation,
                columns=columns,
                rows=rows,
                row_count=len(rows),
                chart_recommendation=chart_rec,
                execution_time_ms=round(elapsed_ms, 2),
                model_used=model_used,
                retries=retries,
            )

        except ValueError:
            # Validation errors — don't retry
            raise

        except Exception as e:
            last_error = str(e)
            retries += 1
            logger.warning(
                "SQL execution failed, retrying",
                attempt=retries,
                error=last_error,
                sql=sql,
            )
            if retries > MAX_RETRIES:
                elapsed_ms = (time.perf_counter() - start_time) * 1000
                _log_query(db, session_id, request.question, sql, False, last_error, elapsed_ms, model_used or "unknown", 0)
                raise RuntimeError(f"Query failed after {MAX_RETRIES} retries. Last error: {last_error}")

    # Should not reach here
    raise RuntimeError("Unexpected end of query pipeline")


def _execute_sql(db: Session, sql: str) -> Tuple[List[str], List[List[Any]]]:
    """Execute a validated SELECT query and return columns + rows."""
    result = db.execute(text(sql))
    columns = list(result.keys())
    rows = [list(row) for row in result.fetchall()]
    return columns, rows


def _log_query(
    db: Session,
    session_id: str,
    question: str,
    sql: str,
    success: bool,
    error_message: Optional[str],
    execution_time_ms: float,
    model_used: str,
    row_count: int,
):
    try:
        log_entry = QueryLog(
            session_id=session_id,
            question=question,
            sql=sql,
            success=success,
            error_message=error_message,
            execution_time_ms=execution_time_ms,
            model_used=model_used,
            row_count=row_count,
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error("Failed to log query", error=str(e))
        db.rollback()
