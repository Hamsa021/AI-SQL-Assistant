import re
from typing import Tuple

# Dangerous SQL patterns that should never run
BLOCKED_PATTERNS = [
    r"\bDROP\b",
    r"\bDELETE\b",
    r"\bUPDATE\b",
    r"\bINSERT\b",
    r"\bALTER\b",
    r"\bTRUNCATE\b",
    r"\bCREATE\b",
    r"\bGRANT\b",
    r"\bREVOKE\b",
    r"\bEXECUTE\b",
    r"\bEXEC\b",
    r"\bSP_\b",
    r"\bXP_\b",
    r"--",           # SQL comment injection
    r"/\*.*\*/",     # Block comments
    r"\bUNION\s+ALL\s+SELECT\b",  # UNION injection
    r"\bINTO\s+OUTFILE\b",
    r"\bINTO\s+DUMPFILE\b",
    r"\bLOAD_FILE\b",
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE | re.DOTALL) for p in BLOCKED_PATTERNS]


def validate_sql(sql: str) -> Tuple[bool, str]:
    """
    Validate SQL for dangerous operations.
    Returns (is_safe, reason).
    """
    if not sql or not sql.strip():
        return False, "Empty SQL query"

    sql_stripped = sql.strip()

    # Must start with SELECT
    if not re.match(r"^\s*SELECT\b", sql_stripped, re.IGNORECASE):
        return False, "Only SELECT queries are allowed"

    # Check for blocked patterns
    for pattern in COMPILED_PATTERNS:
        if pattern.search(sql_stripped):
            matched = pattern.pattern
            return False, f"Blocked SQL pattern detected: {matched}"

    # Check for multiple statements (semicolons mid-query)
    statements = [s.strip() for s in sql_stripped.split(";") if s.strip()]
    if len(statements) > 1:
        return False, "Multiple SQL statements are not allowed"

    return True, "OK"


def extract_sql_from_response(text: str) -> str:
    """
    Extract SQL from LLM response that may wrap it in markdown code blocks.
    """
    # Try ```sql ... ``` block
    match = re.search(r"```sql\s*(.*?)\s*```", text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()

    # Try ``` ... ``` block
    match = re.search(r"```\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        return match.group(1).strip()

    # Look for SELECT ... pattern
    match = re.search(r"(SELECT\b.*?)(?:;|\Z)", text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()

    return text.strip()


def sanitize_identifier(name: str) -> str:
    """Sanitize a SQL identifier (table/column name)."""
    return re.sub(r"[^\w]", "", name)
