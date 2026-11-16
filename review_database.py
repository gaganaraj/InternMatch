import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

# Load database configuration
load_dotenv(Path(__file__).resolve().parent / ".env.local")

# Connect to PostgreSQL
connection = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT", "5432"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
)

cursor = connection.cursor()

print("\n========== DATABASE TABLES ==========")

cursor.execute("""
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
""")

tables = [row[0] for row in cursor.fetchall()]

for table in tables:
    print(f"\nTABLE: {table}")

    cursor.execute("""
        SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = %s
        ORDER BY ordinal_position;
    """, (table,))

    for column in cursor.fetchall():
        print(
            f"  {column[0]} | {column[1]} "
            f"| Nullable: {column[2]} "
            f"| Default: {column[3]}"
        )

print("\n========== CONSTRAINTS ==========")

cursor.execute("""
    SELECT
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS referenced_table,
        ccu.column_name AS referenced_column
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_type;
""")

for row in cursor.fetchall():
    print(row)

print("\n========== INDEXES ==========")

cursor.execute("""
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
""")

for row in cursor.fetchall():
    print(row)

print("\n========== RECORD COUNTS ==========")

for table in tables:
    cursor.execute(f'SELECT COUNT(*) FROM public."{table}"')
    print(f"{table}: {cursor.fetchone()[0]} records")

cursor.close()
connection.close()

print("\nDATABASE INSPECTION COMPLETED.")