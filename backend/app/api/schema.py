from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.schemas import SchemaResponse
from app.services.schema_service import get_schema

router = APIRouter(prefix="/schema", tags=["schema"])


@router.get("/", response_model=SchemaResponse)
def get_db_schema(db: Session = Depends(get_db)):
    """Return the full database schema with table and column information."""
    tables = get_schema(db)
    return SchemaResponse(tables=tables, total_tables=len(tables))
