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
        conname,
        contype,
        pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'internship_skills'::regclass
    ORDER BY contype;
""")

print("\nINTERNSHIP_SKILLS CONSTRAINTS")
print("--------------------------------")

for name, constraint_type, definition in cursor.fetchall():
    types = {
        "p": "PRIMARY KEY",
        "f": "FOREIGN KEY",
        "u": "UNIQUE",
        "c": "CHECK",
    }
    print(f"{name} : {types.get(constraint_type, constraint_type)}")
    print(f"Definition: {definition}\n")

cursor.close()
connection.close()