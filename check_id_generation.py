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
        is_identity,
        identity_generation,
        column_default,
        pg_get_serial_sequence(
            format('%I.%I', table_schema, table_name),
            column_name
        ) AS sequence_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND (
          (table_name = 'users' AND column_name = 'user_id')
          OR (table_name = 'skills' AND column_name = 'skill_id')
          OR (table_name = 'projects' AND column_name = 'project_id')
          OR (table_name = 'internships' AND column_name = 'internship_id')
          OR (table_name = 'applications' AND column_name = 'application_id')
      )
    ORDER BY table_name;
""")

print("\nID GENERATION DETAILS")
print("=" * 60)

for row in cursor.fetchall():
    table, column, identity, generation, default, sequence = row

    print(f"\nTable: {table}")
    print(f"Column: {column}")
    print(f"Identity: {identity}")
    print(f"Generation: {generation}")
    print(f"Default: {default}")
    print(f"Sequence: {sequence}")

cursor.close()
connection.close()