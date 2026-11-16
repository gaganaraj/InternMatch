
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
        CREATE OR REPLACE FUNCTION get_student_internship_matches(
            p_student_id BIGINT
        )
        RETURNS TABLE (
            student_id BIGINT,
            internship_id BIGINT,
            internship_title TEXT,
            company_name TEXT,
            total_required_skills BIGINT,
            matched_skills BIGINT,
            matching_skill_names TEXT,
            skill_match_percentage NUMERIC,
            mandatory_match_percentage NUMERIC,
            internship_rank BIGINT
        )
        LANGUAGE SQL
        AS $$
            WITH skill_matching AS (
                SELECT
                    sp.user_id AS matched_student_id,
                    i.internship_id AS matched_internship_id,
                    i.title::TEXT AS matched_title,
                    i.company_name::TEXT AS matched_company,

                    COUNT(isk.skill_id) AS required_count,
                    COUNT(ss.skill_id) AS matched_count,

                    COUNT(isk.skill_id)
                        FILTER (WHERE isk.is_mandatory = TRUE)
                        AS mandatory_required,

                    COUNT(ss.skill_id)
                        FILTER (WHERE isk.is_mandatory = TRUE)
                        AS mandatory_matched,

                    STRING_AGG(
                        DISTINCT s.skill_name,
                        ', ' ORDER BY s.skill_name
                    ) FILTER (WHERE ss.skill_id IS NOT NULL)
                        AS matched_skill_names

                FROM student_profiles sp

                CROSS JOIN internships i

                JOIN internship_skills isk
                    ON i.internship_id = isk.internship_id

                JOIN skills s
                    ON isk.skill_id = s.skill_id

                LEFT JOIN student_skills ss
                    ON sp.user_id = ss.user_id
                    AND ss.skill_id = isk.skill_id

                WHERE sp.user_id = p_student_id
                  AND i.status = 'open'

                GROUP BY
                    sp.user_id,
                    i.internship_id,
                    i.title,
                    i.company_name
            ),

            scored_matches AS (
                SELECT
                    *,
                    ROUND(
                        matched_count * 100.0 /
                        NULLIF(required_count, 0),
                        2
                    ) AS skill_percentage,

                    ROUND(
                        mandatory_matched * 100.0 /
                        NULLIF(mandatory_required, 0),
                        2
                    ) AS mandatory_percentage

                FROM skill_matching
            ),

            ranked_matches AS (
                SELECT
                    *,
                    RANK() OVER (
                        ORDER BY
                            skill_percentage DESC,
                            mandatory_percentage DESC
                    ) AS match_rank

                FROM scored_matches
            )

            SELECT
                matched_student_id,
                matched_internship_id,
                matched_title,
                matched_company,
                required_count,
                matched_count,
                matched_skill_names,
                skill_percentage,
                mandatory_percentage,
                match_rank

            FROM ranked_matches
            ORDER BY match_rank;
        $$;
    """)

    connection.commit()
    print("Stored function created successfully!")

    for student_id in (2, 3):
        print(f"\nRECOMMENDATIONS FOR STUDENT {student_id}")
        print("-" * 60)

        cursor.execute(
            "SELECT * FROM get_student_internship_matches(%s)",
            (student_id,)
        )

        for row in cursor.fetchall():
            print(row)

except Exception:
    connection.rollback()
    raise

finally:
    connection.close()
