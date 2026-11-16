
import os
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

# Load credentials from the existing Next.js environment file
load_dotenv(Path(__file__).resolve().parent / ".env.local")

try:
    connection = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=5,
    )

    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            current_database(),
            current_user,
            COUNT(*)
        FROM internships;
    """)

    database, username, internship_count = cursor.fetchone()

    print("PostgreSQL connection successful!")
    print("Database:", database)
    print("Connected user:", username)
    print("Internship records:", internship_count)

    cursor.close()
    connection.close()

except Exception as error:
    print("PostgreSQL connection failed.")
    print("Error:", error)
