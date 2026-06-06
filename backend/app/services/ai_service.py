import json
import re
from typing import List, Tuple, Optional
import anthropic
import openai
import structlog

from app.core.config import settings
from app.models.schemas import Message, ModelProvider, ChartRecommendation, ChartType
from app.utils.sql_validator import extract_sql_from_response

logger = structlog.get_logger()

SYSTEM_PROMPT = """You are an expert SQL assistant. Your job is to convert natural language questions into accurate, efficient SQL SELECT queries.

Rules:
- ONLY generate SELECT statements. Never use DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, CREATE.
- Use proper PostgreSQL syntax.
- Always use table aliases for readability when joining multiple tables.
- Prefer LIMIT clauses to avoid returning huge result sets (default LIMIT 100 unless asked otherwise).
- When the user asks a follow-up question, use the conversation context to understand what they mean.
- Format SQL cleanly with proper indentation.

Response format (always respond with valid JSON):
{
  "sql": "SELECT ...",
  "explanation": "Plain English explanation of what the query does and what it returns",
  "chart_recommendation": {
    "type": "bar|line|pie|none",
    "x_column": "column_name_or_null",
    "y_column": "column_name_or_null",
    "label_column": "column_name_or_null",
    "value_column": "column_name_or_null",
    "title": "Chart title"
  }
}

Chart recommendation rules:
- "bar": comparisons between categories (e.g., sales by region)
- "line": time series data (e.g., revenue over months)
- "pie": proportions/percentages (e.g., market share)
- "none": raw data dumps, many columns, or non-visual queries

If there's a SQL error, you'll be given the error message. Fix the query and return the corrected JSON.
"""


def _build_messages(
    question: str,
    schema_text: str,
    conversation_history: List[Message],
    error_feedback: Optional[str] = None,
) -> List[dict]:
    messages = []

    # Schema as first user message for context
    schema_msg = f"Here is the current database schema:\n\n{schema_text}"
    messages.append({"role": "user", "content": schema_msg})
    messages.append({"role": "assistant", "content": '{"acknowledged": "Schema received. Ready to help."}'})

    # Conversation history
    for msg in conversation_history[-10:]:  # Keep last 10 for context window
        messages.append({"role": msg.role, "content": msg.content})

    # Current question
    user_content = question
    if error_feedback:
        user_content = f"The previous SQL query failed with this error:\n{error_feedback}\n\nPlease fix the query for: {question}"

    messages.append({"role": "user", "content": user_content})
    return messages


def _parse_ai_response(raw: str) -> dict:
    """Parse JSON from AI response, handling markdown fences."""
    text = raw.strip()

    # Strip ```json or ``` fences
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON object
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Could not parse JSON from AI response: {text[:200]}")


async def generate_sql_anthropic(
    question: str,
    schema_text: str,
    conversation_history: List[Message],
    error_feedback: Optional[str] = None,
) -> dict:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    messages = _build_messages(question, schema_text, conversation_history, error_feedback)

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=messages,
    )

    raw = response.content[0].text
    return _parse_ai_response(raw)


async def generate_sql_openai(
    question: str,
    schema_text: str,
    conversation_history: List[Message],
    error_feedback: Optional[str] = None,
) -> dict:
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += _build_messages(question, schema_text, conversation_history, error_feedback)

    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=2048,
        messages=messages,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    return _parse_ai_response(raw)


async def generate_sql(
    question: str,
    schema_text: str,
    conversation_history: List[Message],
    provider: ModelProvider,
    error_feedback: Optional[str] = None,
) -> Tuple[dict, str]:
    """
    Generate SQL using the selected AI provider.
    Returns (parsed_response, model_name_used).
    """
    if provider == ModelProvider.ANTHROPIC:
        result = await generate_sql_anthropic(question, schema_text, conversation_history, error_feedback)
        model_used = "claude-sonnet-4-20250514"
    else:
        result = await generate_sql_openai(question, schema_text, conversation_history, error_feedback)
        model_used = "gpt-4o"

    return result, model_used


def parse_chart_recommendation(raw: dict) -> ChartRecommendation:
    chart = raw.get("chart_recommendation", {})
    chart_type_str = chart.get("type", "none").lower()
    try:
        chart_type = ChartType(chart_type_str)
    except ValueError:
        chart_type = ChartType.NONE

    return ChartRecommendation(
        type=chart_type,
        x_column=chart.get("x_column"),
        y_column=chart.get("y_column"),
        label_column=chart.get("label_column"),
        value_column=chart.get("value_column"),
        title=chart.get("title", ""),
    )
