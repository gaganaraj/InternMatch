
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

    cursor.execute("""
        SELECT to_regclass(
            'public.v_internship_application_dashboard'
        );
    """)

    existing_view = cursor.fetchone()[0]

    if existing_view is not None:
        print("View already exists. No changes made.")
    else:
        cursor.execute("""
            CREATE VIEW v_internship_application_dashboard AS
            SELECT
                i.internship_id,
                i.title,
                i.company_name,
                i.status,
                COUNT(DISTINCT isk.skill_id) AS required_skills,
                COUNT(DISTINCT a.application_id) AS total_applications,
                COUNT(DISTINCT a.application_id)
                    FILTER (WHERE a.status = 'submitted')
                    AS submitted_applications,
                COUNT(DISTINCT a.application_id)
                    FILTER (WHERE a.status = 'shortlisted')
                    AS shortlisted_applications,
                COUNT(DISTINCT a.application_id)
                    FILTER (WHERE a.status = 'accepted')
                    AS accepted_applications
            FROM internships i
            LEFT JOIN internship_skills isk
                ON i.internship_id = isk.internship_id
            LEFT JOIN applications a
                ON i.internship_id = a.internship_id
            GROUP BY
                i.internship_id,
                i.title,
                i.company_name,
                i.status;
        """)

        connection.commit()
        print("Dashboard view created successfully!")

    cursor.execute("""
        SELECT *
        FROM v_internship_application_dashboard
        ORDER BY internship_id;
    """)

    print("\nINTERNSHIP APPLICATION DASHBOARD")
    print("=" * 60)

    for row in cursor.fetchall():
        print(row)

except Exception:
    connection.rollback()
    raise

finally:
    if connection:
        connection.close()
