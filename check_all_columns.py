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
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name IN (
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
    ORDER BY table_name, ordinal_position;
""")

print("\nALL TABLE COLUMNS")
print("=" * 70)

current_table = None

for table, column, data_type, nullable, default in cursor.fetchall():
    if table != current_table:
        current_table = table
        print(f"\nTABLE: {table}")
        print("-" * 50)

    print(
        f"{column} | {data_type} | "
        f"Nullable: {nullable} | Default: {default}"
    )

cursor.close()
connection.close()