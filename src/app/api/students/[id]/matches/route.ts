
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentSession } from "@/lib/student-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const studentId = Number(id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid student ID." },
        { status: 400 }
      );
    }

    // Verify the logged-in student
    const session = await getStudentSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in." },
        { status: 401 }
      );
    }

    if (session.userId !== studentId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot access another student's data.",
        },
        { status: 403 }
      );
    }

    const studentResult = await db.query(
      `SELECT u.user_id, sp.full_name, sp.education,
              sp.career_goals
       FROM users u
       JOIN student_profiles sp ON sp.user_id = u.user_id
       WHERE u.user_id = $1 AND u.role = 'student'`,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 }
      );
    }

    const matchesResult = await db.query(
      `SELECT
         i.internship_id,
         i.title,
         i.company_name,
         i.description,
         i.location,
         i.work_mode,
         i.stipend,
         COUNT(DISTINCT isk.skill_id)::int AS total_required_skills,
         COUNT(DISTINCT isk.skill_id)
           FILTER (WHERE ss.skill_id IS NOT NULL)::int AS matched_skill_count,
         ROUND(
           100.0 * COUNT(DISTINCT isk.skill_id)
             FILTER (WHERE ss.skill_id IS NOT NULL)
           / NULLIF(COUNT(DISTINCT isk.skill_id), 0),
           2
         ) AS skill_coverage_percent,
         COALESCE(
           json_agg(
             DISTINCT jsonb_build_object(
               'skill_id', s.skill_id,
               'skill_name', s.skill_name,
               'matched', (ss.skill_id IS NOT NULL),
               'is_mandatory', isk.is_mandatory
             )
           ) FILTER (WHERE s.skill_id IS NOT NULL),
           '[]'::json
         ) AS required_skills,
         COALESCE(
           json_agg(DISTINCT s.skill_name)
             FILTER (
               WHERE s.skill_id IS NOT NULL
                 AND ss.skill_id IS NULL
             ),
           '[]'::json
         ) AS missing_skills
       FROM internships i
       LEFT JOIN internship_skills isk
         ON isk.internship_id = i.internship_id
       LEFT JOIN skills s ON s.skill_id = isk.skill_id
       LEFT JOIN student_skills ss
         ON ss.user_id = $1
        AND ss.skill_id = isk.skill_id
       WHERE i.status = 'open'
       GROUP BY i.internship_id
       ORDER BY skill_coverage_percent DESC NULLS LAST,
                i.title ASC`,
      [studentId]
    );

    return NextResponse.json({
      success: true,
      student: studentResult.rows[0],
      count: matchesResult.rows.length,
      matches: matchesResult.rows,
      scoring_note:
        "Skill coverage measures the proportion of listed required skills found in the student's recorded skills. It is not semantic similarity or a guarantee of eligibility.",
    });
  } catch (error) {
    console.error("Student matching API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Could not calculate internship matches.",
      },
      { status: 500 }
    );
  }
}
