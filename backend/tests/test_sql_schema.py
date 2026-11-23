import os
import re
import sys
import sqlparse

def test_migration_schema():
    migration_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "supabase", "migrations", "001_initial_schema.sql"
    )
    assert os.path.exists(migration_path), f"File not found: {migration_path}"

    with open(migration_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Verify no emojis
    emoji_pattern = re.compile(
        r"[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\ud83c-\ud83e][\ud000-\udfff]",
        flags=re.UNICODE,
    )
    assert not emoji_pattern.search(content), "Error: Found emoji in SQL migration file"

    # 2. Parse SQL statements using sqlparse
    statements = sqlparse.parse(content)
    assert len(statements) > 0, "No SQL statements found in migration"

    # 3. Check table creation statements
    expected_tables = ["profiles", "resumes", "interview_sessions", "interview_turns"]
    content_lower = content.lower()

    for table in expected_tables:
        assert f"create table if not exists public.{table}" in content_lower or f"create table public.{table}" in content_lower, (
            f"Missing CREATE TABLE statement for {table}"
        )
        assert f"alter table public.{table} enable row level security;" in content_lower, (
            f"Missing RLS enable statement for {table}"
        )

    # 4. Check storage buckets
    assert "'resumes'" in content_lower, "Missing resumes storage bucket"
    assert "'interview-audio'" in content_lower, "Missing interview-audio storage bucket"

    # 5. Check trigger and functions
    assert "handle_updated_at" in content_lower, "Missing handle_updated_at trigger function"
    assert "handle_new_user" in content_lower, "Missing handle_new_user trigger function"

    print(f"Validation successful: Parsed {len(statements)} SQL statements. All tables, RLS policies, triggers, and storage buckets verified.")

if __name__ == "__main__":
    try:
        test_migration_schema()
    except AssertionError as e:
        print(f"Test failed: {e}", file=sys.stderr)
        sys.exit(1)
