
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

try:
    cursor = connection.cursor()

    student_id = 2
    internship_id = 3

    # Check whether this application already exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT 1
            FROM applications
            WHERE student_id = %s
              AND internship_id = %s
        );
    """, (student_id, internship_id))

    if cursor.fetchone()[0]:
        print("Test skipped: application already exists.")
    else:
        # Start transaction
        cursor.execute("BEGIN;")

        # Insert application
        cursor.execute("""
            INSERT INTO applications (student_id, internship_id)
            VALUES (%s, %s)
            RETURNING application_id, student_id, internship_id, status;
        """, (student_id, internship_id))

        inserted_record = cursor.fetchone()

        print("\nAPPLICATION INSERTED")
        print(inserted_record)

        # Verify record inside the transaction
        cursor.execute("""
            SELECT COUNT(*)
            FROM applications
            WHERE student_id = %s
              AND internship_id = %s;
        """, (student_id, internship_id))

        print("Records inside transaction:", cursor.fetchone()[0])

        # Roll back test transaction
        connection.rollback()
        print("\nROLLBACK EXECUTED SUCCESSFULLY")

        # Verify that the test record is gone
        cursor.execute("""
            SELECT COUNT(*)
            FROM applications
            WHERE student_id = %s
              AND internship_id = %s;
        """, (student_id, internship_id))

        print("Records after rollback:", cursor.fetchone()[0])

except Exception:
    connection.rollback()
    raise

finally:
    connection.close()

