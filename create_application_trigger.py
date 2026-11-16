
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

    # Create the trigger function
    cursor.execute("""
        CREATE OR REPLACE FUNCTION validate_internship_application()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        AS $$
        DECLARE
            internship_status VARCHAR;
            internship_deadline DATE;
        BEGIN
            SELECT status, deadline
            INTO internship_status, internship_deadline
            FROM internships
            WHERE internship_id = NEW.internship_id;

            IF NOT FOUND THEN
                RAISE EXCEPTION
                    'Internship % does not exist',
                    NEW.internship_id;
            END IF;

            IF internship_status <> 'open' THEN
                RAISE EXCEPTION
                    'Applications are not allowed for closed or draft internships';
            END IF;

            IF internship_deadline IS NOT NULL
               AND internship_deadline < CURRENT_DATE THEN
                RAISE EXCEPTION
                    'Application deadline has passed';
            END IF;

            RETURN NEW;
        END;
        $$;
    """)

    # Recreate the trigger safely
    cursor.execute("""
        DROP TRIGGER IF EXISTS trg_validate_internship_application
        ON applications;
    """)

    cursor.execute("""
        CREATE TRIGGER trg_validate_internship_application
        BEFORE INSERT OR UPDATE OF internship_id
        ON applications
        FOR EACH ROW
        EXECUTE FUNCTION validate_internship_application();
    """)

    connection.commit()
    print("Application validation trigger created successfully!")

    # Test: temporarily close internship 1 and try applying.
    # The transaction will be rolled back, so existing data is preserved.
    try:
        cursor.execute("""
            UPDATE internships
            SET status = 'closed'
            WHERE internship_id = 1;
        """)

        cursor.execute("""
            INSERT INTO applications (student_id, internship_id)
            VALUES (2, 1);
        """)

        connection.commit()
        print("WARNING: Invalid application was unexpectedly accepted.")

    except psycopg2.Error as error:
        connection.rollback()
        print("\nTRIGGER TEST PASSED!")
        print("Invalid application was rejected.")
        print("Database message:", error.diag.message_primary)

    # Confirm internship status was restored
    cursor.execute("""
        SELECT status
        FROM internships
        WHERE internship_id = 1;
    """)

    print("\nInternship 1 status after test:", cursor.fetchone()[0])

except Exception:
    connection.rollback()
    raise

finally:
    connection.close()
