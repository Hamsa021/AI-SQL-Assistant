from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class QueryLog(Base):
    __tablename__ = "query_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), index=True, nullable=False)
    question = Column(Text, nullable=False)
    sql = Column(Text, nullable=True)
    success = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    model_used = Column(String(64), nullable=False)
    row_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
