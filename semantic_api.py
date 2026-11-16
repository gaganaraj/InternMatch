
import os
from pathlib import Path
from datetime import date, datetime
from decimal import Decimal

import chromadb
import psycopg2

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from psycopg2.extras import RealDictCursor


# --------------------------------------------------
# 1. CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env.local")

app = FastAPI(
    title="InternMatch Semantic Matching API",
    description="PostgreSQL + ChromaDB internship recommendation system",
    version="3.0.0",
)


def get_db_connection():
    required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"]

    missing = [key for key in required if not os.getenv(key)]

    if missing:
        raise RuntimeError(
            "Missing database configuration: " + ", ".join(missing)
        )

    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=5,
    )


# --------------------------------------------------
# 2. LOAD AI MODEL
# --------------------------------------------------

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

model = SentenceTransformer(MODEL_NAME)


# --------------------------------------------------
# 3. CONNECT TO PERSISTENT CHROMADB
# --------------------------------------------------

client = chromadb.PersistentClient(
    path=str(BASE_DIR / "chroma_data")
)

collection = client.get_or_create_collection(
    name="internship_embeddings",
    metadata={"hnsw:space": "cosine"},
)


# --------------------------------------------------
# 4. REQUEST MODELS
# --------------------------------------------------

class MatchRequest(BaseModel):
    student_profile: str = Field(min_length=1, max_length=5000)
    internships: list[str] = Field(min_length=1, max_length=50)


class StudentQuery(BaseModel):
    student_profile: str = Field(min_length=1, max_length=5000)


# --------------------------------------------------
# 5. HELPER: BUILD INTERNSHIP DESCRIPTION
# --------------------------------------------------

def build_internship_document(row):
    return " ".join([
        f"Internship: {row['title']}",
        f"Company: {row['company_name']}",
        f"Description: {row['description']}",
        f"Eligibility: {row['eligibility_criteria'] or ''}",
        f"Location: {row['location'] or ''}",
        f"Work mode: {row['work_mode']}",
        f"Internship type: {row['internship_type']}",
        f"Stipend: {row['stipend'] if row['stipend'] is not None else 'Not specified'}",
        f"Required skills: {row['required_skills'] or ''}",
    ])


# --------------------------------------------------
# 6. SYNCHRONISE POSTGRESQL WITH CHROMADB
# --------------------------------------------------

def sync_internships_from_postgres():

    conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:

            cursor.execute("""
                SELECT
                    i.internship_id,
                    i.title,
                    i.company_name,
                    i.description,
                    i.location,
                    i.work_mode,
                    i.internship_type,
                    i.stipend,
                    i.eligibility_criteria,
                    i.deadline,
                    i.status,

                    COALESCE(
                        (
                            SELECT STRING_AGG(
                                s.skill_name,
                                ', ' ORDER BY s.skill_name
                            )
                            FROM internship_skills isk
                            JOIN skills s
                                ON s.skill_id = isk.skill_id
                            WHERE isk.internship_id = i.internship_id
                        ),
                        ''
                    ) AS required_skills

                FROM internships i

                WHERE i.status = 'open'
                  AND (
                      i.deadline IS NULL
                      OR i.deadline >= CURRENT_DATE
                  )

                ORDER BY i.internship_id;
            """)

            internships = cursor.fetchall()

        ids = []
        documents = []
        metadatas = []

        for row in internships:

            internship_id = str(row["internship_id"])

            ids.append(internship_id)
            documents.append(build_internship_document(row))

            metadatas.append({
                "internship_id": int(row["internship_id"]),
                "company_name": row["company_name"] or "",
                "title": row["title"] or "",
                "location": row["location"] or "",
                "work_mode": row["work_mode"] or "",
                "internship_type": row["internship_type"] or "",
                "status": row["status"] or "",
                "required_skills": row["required_skills"] or "",
                "deadline": (
                    row["deadline"].isoformat()
                    if row["deadline"] else ""
                ),
            })

        # Remove outdated or closed internship vectors.
        existing_ids = collection.get()["ids"]

        stale_ids = [
            item_id for item_id in existing_ids
            if item_id not in ids
        ]

        if stale_ids:
            collection.delete(ids=stale_ids)

        # Update existing records or insert new records.
        if ids:

            embeddings = model.encode(
                documents,
                normalize_embeddings=True
            ).tolist()

            collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
                embeddings=embeddings,
            )

        return {
            "success": True,
            "postgresql_open_internships": len(internships),
            "vectors_updated": len(ids),
            "stale_vectors_removed": len(stale_ids),
            "total_vectors": collection.count(),
        }

    finally:
        conn.close()


# --------------------------------------------------
# 7. FETCH STUDENT PROFILE FROM POSTGRESQL
# --------------------------------------------------

def get_student_profile(student_id):

    conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:

            cursor.execute("""
                SELECT
                    sp.user_id,
                    sp.full_name,
                    sp.education,
                    sp.graduation_year,
                    sp.career_goals,
                    sp.profile_text

                FROM student_profiles sp

                JOIN users u
                    ON u.user_id = sp.user_id

                WHERE sp.user_id = %s
                  AND u.role = 'student';
            """, (student_id,))

            profile = cursor.fetchone()

            if not profile:
                return None

            cursor.execute("""
                SELECT
                    s.skill_name,
                    ss.proficiency

                FROM student_skills ss

                JOIN skills s
                    ON s.skill_id = ss.skill_id

                WHERE ss.user_id = %s

                ORDER BY s.skill_name;
            """, (student_id,))

            skills = cursor.fetchall()

            cursor.execute("""
                SELECT
                    project_title,
                    description

                FROM projects

                WHERE user_id = %s

                ORDER BY created_at DESC;
            """, (student_id,))

            projects = cursor.fetchall()

        student_text = " ".join([
            f"Name: {profile['full_name']}",
            f"Education: {profile['education'] or ''}",
            f"Graduation year: {profile['graduation_year'] or ''}",
            f"Career goals: {profile['career_goals'] or ''}",
            f"Profile: {profile['profile_text'] or ''}",
            "Skills: " + ", ".join(
                f"{s['skill_name']} proficiency {s['proficiency']}"
                for s in skills
            ),
            "Projects: " + " ".join(
                f"{p['project_title']} {p['description']}"
                for p in projects
            ),
        ])

        return {
            "student_id": profile["user_id"],
            "student_name": profile["full_name"],
            "profile_text": student_text,
            "skills": [s["skill_name"] for s in skills],
        }

    finally:
        conn.close()


# --------------------------------------------------
# 8. FETCH MATCHED INTERNSHIP DETAILS FROM POSTGRESQL
# --------------------------------------------------

def get_internship_details(internship_ids):

    if not internship_ids:
        return {}

    conn = get_db_connection()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:

            cursor.execute("""
                SELECT
                    i.internship_id,
                    i.title,
                    i.company_name,
                    i.description,
                    i.location,
                    i.work_mode,
                    i.internship_type,
                    i.stipend,
                    i.eligibility_criteria,
                    i.deadline,
                    i.status,

                    COALESCE(
                        (
                            SELECT STRING_AGG(
                                s.skill_name,
                                ', ' ORDER BY s.skill_name
                            )
                            FROM internship_skills isk
                            JOIN skills s
                                ON s.skill_id = isk.skill_id
                            WHERE isk.internship_id = i.internship_id
                        ),
                        ''
                    ) AS required_skills

                FROM internships i

                WHERE i.internship_id = ANY(%s)
                  AND i.status = 'open'
                  AND (
                      i.deadline IS NULL
                      OR i.deadline >= CURRENT_DATE
                  );
            """, (internship_ids,))

            rows = cursor.fetchall()

        result = {}

        for row in rows:
            item = dict(row)

            for key, value in item.items():

                if isinstance(value, Decimal):
                    item[key] = float(value)

                elif isinstance(value, (date, datetime)):
                    item[key] = value.isoformat()

            result[str(item["internship_id"])] = item

        return result

    finally:
        conn.close()


# --------------------------------------------------
# 9. HOME ENDPOINT
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "InternMatch Semantic Matching API is running",
        "version": "3.0.0",
        "model": MODEL_NAME,
        "vector_database": "ChromaDB",
        "stored_vectors": collection.count(),
    }


# --------------------------------------------------
# 10. SYNCHRONISATION ENDPOINT
# --------------------------------------------------

@app.post("/sync-internships")
def sync_internships():

    try:
        return sync_internships_from_postgres()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Internship synchronisation failed: {str(error)}"
        )


# --------------------------------------------------
# 11. PERSONALIZED STUDENT RECOMMENDATIONS
# --------------------------------------------------

@app.get("/recommend/{student_id}")
def recommend_internships(student_id: int):

    try:
        student = get_student_profile(student_id)

        if not student:
            raise HTTPException(
                status_code=404,
                detail="Student profile not found."
            )

        total_vectors = collection.count()

        if total_vectors == 0:
            return {
                "success": True,
                "message": "Synchronise internships before searching.",
                "results": [],
            }

        query_embedding = model.encode(
            [student["profile_text"]],
            normalize_embeddings=True
        ).tolist()

        search_results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(10, total_vectors),
            include=["documents", "metadatas", "distances"],
        )

        matches = []

        matched_ids = search_results["ids"][0]
        distances = search_results["distances"][0]

        details = get_internship_details([
            int(item_id) for item_id in matched_ids
        ])

        for index, internship_id in enumerate(matched_ids):

            internship = details.get(internship_id)

            if not internship:
                continue

            distance = float(distances[index])

            matches.append({
                **internship,
                "cosine_distance": round(distance, 4),
                "semantic_similarity": round(
                    (1 - distance) * 100, 2
                ),
            })

        return {
            "success": True,
            "student_id": student["student_id"],
            "student_name": student["student_name"],
            "matching_method": "Sentence Transformers + ChromaDB cosine similarity",
            "model": MODEL_NAME,
            "note": "Semantic similarity is a relevance measure, not a probability of selection.",
            "results": matches,
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation failed: {str(error)}"
        )


# --------------------------------------------------
# 12. LEGACY DIRECT SEMANTIC MATCHING
# --------------------------------------------------

@app.post("/semantic-match")
def semantic_match(request: MatchRequest):

    student_text = request.student_profile.strip()

    internship_texts = [
        text.strip() for text in request.internships
    ]

    if not student_text or any(not text for text in internship_texts):
        raise HTTPException(
            status_code=422,
            detail="Profile and internship descriptions cannot be blank."
        )

    embeddings = model.encode(
        [student_text] + internship_texts,
        normalize_embeddings=True,
    )

    scores = embeddings[0] @ embeddings[1:].T

    results = [
        {
            "internship": text,
            "semantic_similarity": round(
                float(scores[index]), 4
            ),
        }
        for index, text in enumerate(internship_texts)
    ]

    results.sort(
        key=lambda item: item["semantic_similarity"],
        reverse=True,
    )

    return {
        "method": "Sentence embeddings + cosine similarity",
        "model": MODEL_NAME,
        "results": results,
    }


# --------------------------------------------------
# 13. LEGACY CHROMADB SEARCH
# --------------------------------------------------

@app.post("/search-stored-internships")
def search_stored_internships(request: StudentQuery):

    student_text = request.student_profile.strip()

    if not student_text:
        raise HTTPException(
            status_code=422,
            detail="Student profile cannot be blank."
        )

    total_vectors = collection.count()

    if total_vectors == 0:
        return {
            "success": True,
            "message": "No internships have been stored yet.",
            "results": [],
        }

    query_embedding = model.encode(
        [student_text],
        normalize_embeddings=True,
    ).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(10, total_vectors),
        include=["documents", "metadatas", "distances"],
    )

    matches = []

    for index, internship_id in enumerate(results["ids"][0]):

        distance = float(results["distances"][0][index])

        matches.append({
            "internship_id": internship_id,
            "description": results["documents"][0][index],
            "metadata": results["metadatas"][0][index],
            "cosine_distance": round(distance, 4),
            "similarity": round(1 - distance, 4),
        })

    return {
        "success": True,
        "database": "ChromaDB",
        "method": "Vector similarity search",
        "results": matches,
    }
