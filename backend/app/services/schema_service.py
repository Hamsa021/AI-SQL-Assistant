from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.schemas import TableSchema, ColumnInfo
import structlog

logger = structlog.get_logger()


def get_schema(db: Session) -> List[TableSchema]:
    """Extract full schema from the connected PostgreSQL database."""
    inspector = inspect(db.bind)
    tables = []

    table_names = inspector.get_table_names(schema="public")

    for table_name in table_names:
        # Skip internal/system tables
        if table_name.startswith("_") or table_name in ("query_logs", "alembic_version"):
            continue

        columns_info = inspector.get_columns(table_name, schema="public")
        pk_constraint = inspector.get_pk_constraint(table_name, schema="public")
        pk_columns = set(pk_constraint.get("constrained_columns", []))
        fk_list = inspector.get_foreign_keys(table_name, schema="public")

        # Build FK map
        fk_map: Dict[str, List[str]] = {}
        for fk in fk_list:
            for col in fk["constrained_columns"]:
                ref = f"{fk['referred_table']}.{fk['referred_columns'][0]}"
                fk_map.setdefault(col, []).append(ref)

        columns = [
            ColumnInfo(
                name=col["name"],
                type=str(col["type"]),
                nullable=col.get("nullable", True),
                primary_key=col["name"] in pk_columns,
                foreign_keys=fk_map.get(col["name"], []),
            )
            for col in columns_info
        ]

        # Get approximate row count
        try:
            result = db.execute(
                text(f"SELECT reltuples::BIGINT FROM pg_class WHERE relname = :tname"),
                {"tname": table_name},
            ).scalar()
            row_count = int(result) if result is not None else None
        except Exception:
            row_count = None

        tables.append(TableSchema(name=table_name, columns=columns, row_count=row_count))

    return tables


def schema_to_text(tables: List[TableSchema]) -> str:
    """Convert schema list to a compact text representation for LLM prompts."""
    lines = ["Database Schema:"]
    for table in tables:
        col_defs = []
        for col in table.columns:
            flags = []
            if col.primary_key:
                flags.append("PK")
            if not col.nullable:
                flags.append("NOT NULL")
            if col.foreign_keys:
                flags.append(f"FK→{', '.join(col.foreign_keys)}")
            flag_str = f" [{', '.join(flags)}]" if flags else ""
            col_defs.append(f"  {col.name} {col.type}{flag_str}")
        row_info = f" (~{table.row_count} rows)" if table.row_count else ""
        lines.append(f"\nTABLE {table.name}{row_info}:")
        lines.extend(col_defs)
    return "\n".join(lines)
