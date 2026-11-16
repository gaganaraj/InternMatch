import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env.local")

connection = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT", "5432"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
)

cursor = connection.cursor()

cursor.execute("""
    SELECT
        tablename,
        indexname,
        indexdef
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND tablename IN (
          'users',
          'student_profiles',
          'skills',
          'student_skills',
          'projects',
          'internships',
          'internship_skills',
          'applications',
          'saved_internships'
      )
    ORDER BY tablename, indexname;
""")

print("\\nDATABASE INDEXES")
print("=" * 60)

for table, index_name, definition in cursor.fetchall():
    print(f"\\nTable: {table}")
    print(f"Index: {index_name}")
    print(f"Definition: {definition}")

cursor.close()
connection.close()