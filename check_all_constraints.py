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
        tbl.relname AS table_name,
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class tbl
        ON tbl.oid = con.conrelid
    JOIN pg_namespace ns
        ON ns.oid = tbl.relnamespace
    WHERE ns.nspname = current_schema()
      AND tbl.relname IN (
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
    ORDER BY tbl.relname, con.contype;
""")

types = {
    "p": "PRIMARY KEY",
    "f": "FOREIGN KEY",
    "u": "UNIQUE",
    "c": "CHECK",
    "n": "NOT NULL",
}

print("\nDATABASE CONSTRAINTS")
print("=" * 60)

for table, name, constraint_type, definition in cursor.fetchall():
    print(f"\nTABLE: {table}")
    print(f"{types.get(constraint_type, constraint_type)}: {name}")
    print(f"Definition: {definition}")

cursor.close()
connection.close()