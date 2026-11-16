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

print("\nSTUDENT SKILLS")
print("=" * 50)

cursor.execute("""
    SELECT
        sp.user_id,
        ss.skill_id,
        s.skill_name,
        ss.proficiency
    FROM student_profiles sp
    LEFT JOIN student_skills ss
        ON sp.user_id = ss.user_id
    LEFT JOIN skills s
        ON ss.skill_id = s.skill_id
    ORDER BY sp.user_id, s.skill_name;
""")

for row in cursor.fetchall():
    print(row)

print("\nINTERNSHIP SKILL REQUIREMENTS")
print("=" * 50)

cursor.execute("""
    SELECT
        i.internship_id,
        i.title,
        i.company_name,
        i.status,
        s.skill_name,
        isk.is_mandatory
    FROM internships i
    LEFT JOIN internship_skills isk
        ON i.internship_id = isk.internship_id
    LEFT JOIN skills s
        ON isk.skill_id = s.skill_id
    ORDER BY i.internship_id, s.skill_name;
""")

for row in cursor.fetchall():
    print(row)

cursor.close()
connection.close()