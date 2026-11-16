
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

query = """
WITH skill_matching AS (
    SELECT
        sp.user_id AS student_id,
        i.internship_id,
        i.title AS internship_title,
        i.company_name,
        COUNT(isk.skill_id) AS total_required_skills,

        COUNT(ss.skill_id) AS matched_skills,

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
            AS matching_skill_names

    FROM student_profiles sp
    CROSS JOIN internships i

    JOIN internship_skills isk
        ON i.internship_id = isk.internship_id

    JOIN skills s
        ON isk.skill_id = s.skill_id

    LEFT JOIN student_skills ss
        ON sp.user_id = ss.user_id
        AND ss.skill_id = isk.skill_id

    WHERE i.status = 'open'

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
            matched_skills * 100.0 /
            NULLIF(total_required_skills, 0),
            2
        ) AS skill_match_percentage,

        ROUND(
            mandatory_matched * 100.0 /
            NULLIF(mandatory_required, 0),
            2
        ) AS mandatory_match_percentage

    FROM skill_matching
),

ranked_matches AS (
    SELECT
        *,
        RANK() OVER (
            PARTITION BY student_id
            ORDER BY
                skill_match_percentage DESC,
                mandatory_match_percentage DESC
        ) AS internship_rank

    FROM scored_matches
)

SELECT
    student_id,
    internship_id,
    internship_title,
    company_name,
    total_required_skills,
    matched_skills,
    matching_skill_names,
    skill_match_percentage,
    mandatory_match_percentage,
    internship_rank

FROM ranked_matches

ORDER BY student_id, internship_rank;
"""

cursor.execute(query)

print("\nAI INTERNSHIP SKILL MATCHING RESULTS")
print("=" * 65)

columns = [description[0] for description in cursor.description]
print(" | ".join(columns))
print("-" * 65)

for row in cursor.fetchall():
    print(" | ".join(str(value) if value is not None else "None"
                    for value in row))

cursor.close()
connection.close()
