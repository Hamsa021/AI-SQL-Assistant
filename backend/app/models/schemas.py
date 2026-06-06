from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from enum import Enum
from datetime import datetime


class ModelProvider(str, Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"


class ChartType(str, Enum):
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    NONE = "none"


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    model_provider: ModelProvider = ModelProvider.ANTHROPIC
    conversation_history: List[Message] = []
    session_id: Optional[str] = None


class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    primary_key: bool
    foreign_keys: List[str] = []


class TableSchema(BaseModel):
    name: str
    columns: List[ColumnInfo]
    row_count: Optional[int] = None


class ChartRecommendation(BaseModel):
    type: ChartType
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    label_column: Optional[str] = None
    value_column: Optional[str] = None
    title: str = ""


class QueryResponse(BaseModel):
    session_id: str
    sql: str
    explanation: str
    columns: List[str]
    rows: List[List[Any]]
    row_count: int
    chart_recommendation: ChartRecommendation
    execution_time_ms: float
    model_used: str
    retries: int = 0


class SchemaResponse(BaseModel):
    tables: List[TableSchema]
    total_tables: int


class HealthResponse(BaseModel):
    status: str
    database: bool
    anthropic: bool
    openai: bool
    timestamp: datetime


class QueryLogEntry(BaseModel):
    id: int
    session_id: str
    question: str
    sql: str
    success: bool
    error_message: Optional[str]
    execution_time_ms: float
    model_used: str
    created_at: datetime

    class Config:
        from_attributes = True


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
