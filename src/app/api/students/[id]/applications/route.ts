
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentSession } from "@/lib/student-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function authorizeStudent(
  studentId: number
): Promise<NextResponse | null> {
  const session = await getStudentSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: "Please log in." },
      { status: 401 }
    );
  }

  if (Number(session.userId) !== studentId) {
    return NextResponse.json(
      {
        success: false,
        error: "You cannot access another student's data.",
      },
      { status: 403 }
    );
  }

  return null;
}

// GET: Retrieve applications
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const studentId = Number(id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID." },
        { status: 400 }
      );
    }

    const authResponse = await authorizeStudent(studentId);
    if (authResponse) return authResponse;

    const result = await db.query(
      `SELECT
         a.application_id,
         a.internship_id,
         a.status,
         a.applied_at,
         i.title,
         i.company_name
       FROM applications a
       JOIN internships i
         ON i.internship_id = a.internship_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [studentId]
    );

    return NextResponse.json({
      success: true,
      applications: result.rows,
    });
  } catch (error) {
    console.error("Get applications error:", error);

    return NextResponse.json(
      { success: false, error: "Could not retrieve applications." },
      { status: 500 }
    );
  }
}

// POST: Apply for an internship
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const studentId = Number(id);

    const body = await request.json();
    const internshipId = Number(body.internship_id);

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0 ||
      !Number.isInteger(internshipId) ||
      internshipId <= 0
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid student or internship ID." },
        { status: 400 }
      );
    }

    const authResponse = await authorizeStudent(studentId);
    if (authResponse) return authResponse;

    const internship = await db.query(
      `SELECT internship_id
       FROM internships
       WHERE internship_id = $1
         AND status = 'open'
         AND (deadline IS NULL OR deadline >= CURRENT_DATE)`,
      [internshipId]
    );

    if (internship.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Internship is closed or unavailable." },
        { status: 404 }
      );
    }

    const result = await db.query(
      `INSERT INTO applications
         (student_id, internship_id, status)
       VALUES ($1, $2, 'submitted')
       ON CONFLICT (student_id, internship_id) DO NOTHING
       RETURNING application_id, student_id, internship_id, status, applied_at`,
      [studentId, internshipId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already applied for this internship.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully.",
        application: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submit application error:", error);

    return NextResponse.json(
      { success: false, error: "Could not submit application." },
      { status: 500 }
    );
  }
}
