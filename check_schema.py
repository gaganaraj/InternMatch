
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env.local")

conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)

cur = conn.cursor()

cur.execute("""
    SELECT
        u.user_id,
        u.email,
        sp.full_name,
        sp.education,
        sp.graduation_year
    FROM users u
    LEFT JOIN student_profiles sp
        ON sp.user_id = u.user_id
    WHERE u.role = 'student'
    ORDER BY u.user_id
""")

print("\nEXISTING STUDENT ACCOUNTS:\n")

for row in cur.fetchall():
    print(row)

cur.close()
conn.close()
