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

tables = [
    "users",
    "student_profiles",
    "skills",
    "student_skills",
    "projects",
    "internships",
    "internship_skills",
    "applications",
    "saved_internships",
]

print("\nDATABASE RECORD SUMMARY")
print("=" * 45)

for table in tables:
    cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
    count = cursor.fetchone()[0]
    print(f"{table}: {count} records")

print("\nINTERNSHIP STATUS")
cursor.execute("""
    SELECT status, COUNT(*)
    FROM internships
    GROUP BY status
    ORDER BY status;
""")

for status, count in cursor.fetchall():
    print(f"{status}: {count}")

print("\nAPPLICATION STATUS")
cursor.execute("""
    SELECT status, COUNT(*)
    FROM applications
    GROUP BY status
    ORDER BY status;
""")

for status, count in cursor.fetchall():
    print(f"{status}: {count}")

cursor.close()
connection.close()