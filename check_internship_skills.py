
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

# Load environment variables
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

# Fetch internship_skills table structure
cursor.execute("""
    SELECT
        column_name,
        data_type,
        is_nullable
    FROM information_schema.columns
    WHERE table_name = 'internship_skills'
    ORDER BY ordinal_position;
""")

print("\nINTERNSHIP_SKILLS TABLE STRUCTURE")
print("--------------------------------")

for column_name, data_type, nullable in cursor.fetchall():
    print(f"{column_name} : {data_type} : Nullable = {nullable}")

cursor.close()
connection.close()
