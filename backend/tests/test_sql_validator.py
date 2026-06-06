"""
Basic tests for the SQL validator utility.
Run with: pytest backend/tests/ -v
"""
import pytest
from app.utils.sql_validator import validate_sql, extract_sql_from_response


class TestValidateSQL:
    def test_valid_select(self):
        sql = "SELECT id, name FROM customers LIMIT 10"
        ok, msg = validate_sql(sql)
        assert ok is True

    def test_blocks_drop(self):
        ok, msg = validate_sql("DROP TABLE customers")
        assert ok is False  # Caught by SELECT-only rule

    def test_blocks_delete(self):
        ok, msg = validate_sql("DELETE FROM orders WHERE id = 1")
        assert ok is False

    def test_blocks_update(self):
        ok, msg = validate_sql("UPDATE products SET price = 0")
        assert ok is False

    def test_blocks_insert(self):
        ok, msg = validate_sql("INSERT INTO customers VALUES (1, 'hack')")
        assert ok is False

    def test_blocks_truncate(self):
        ok, msg = validate_sql("TRUNCATE TABLE orders")
        assert ok is False

    def test_blocks_multiple_statements(self):
        ok, msg = validate_sql("SELECT 1; DROP TABLE customers")
        assert ok is False

    def test_must_start_with_select(self):
        ok, msg = validate_sql("SHOW TABLES")
        assert ok is False
        assert "SELECT" in msg

    def test_empty_sql(self):
        ok, msg = validate_sql("")
        assert ok is False

    def test_case_insensitive_block(self):
        ok, msg = validate_sql("select * from t; drop table t")
        assert ok is False

    def test_complex_valid_query(self):
        sql = """
        SELECT c.name, COUNT(o.id) AS order_count, SUM(o.total_amount) AS revenue
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id
        WHERE o.order_date >= NOW() - INTERVAL '30 days'
        GROUP BY c.id, c.name
        ORDER BY revenue DESC
        LIMIT 20
        """
        ok, msg = validate_sql(sql)
        assert ok is True


class TestExtractSQL:
    def test_extract_from_sql_block(self):
        text = "Here is the query:\n```sql\nSELECT 1\n```"
        assert extract_sql_from_response(text) == "SELECT 1"

    def test_extract_from_generic_block(self):
        text = "```\nSELECT id FROM users\n```"
        assert "SELECT" in extract_sql_from_response(text)

    def test_extract_bare_select(self):
        text = "The answer is: SELECT name FROM products LIMIT 5"
        result = extract_sql_from_response(text)
        assert result.startswith("SELECT")

    def test_passthrough_plain_sql(self):
        sql = "SELECT * FROM orders"
        assert extract_sql_from_response(sql) == sql
