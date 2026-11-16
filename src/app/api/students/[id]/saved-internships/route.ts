
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentSession } from "@/lib/student-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function authorizeStudent(studentId: number) {
  const session = await getStudentSession();

  if (!session) {
    return { authorized: false, status: 401, error: "Please log in first." };
  }

  if (Number(session.userId) !== studentId) {
    return {
      authorized: false,
      status: 403,
      error: "You cannot access another student's data.",
    };
  }

  return { authorized: true, status: 200, error: "" };
}

// GET: Retrieve saved internships
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

    const auth = await authorizeStudent(studentId);

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const result = await db.query(
      `SELECT
         si.internship_id,
         si.saved_at,
         i.title,
         i.company_name,
         i.location,
         i.work_mode
       FROM saved_internships si
       JOIN internships i
         ON i.internship_id = si.internship_id
       WHERE si.student_id = $1
       ORDER BY si.saved_at DESC`,
      [studentId]
    );

    return NextResponse.json({
      success: true,
      saved_internships: result.rows,
    });
  } catch (error) {
    console.error("Get saved internships error:", error);

    return NextResponse.json(
      { success: false, error: "Could not retrieve saved internships." },
      { status: 500 }
    );
  }
}

// POST: Save an internship
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

    const auth = await authorizeStudent(studentId);

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const internship = await db.query(
      `SELECT internship_id
       FROM internships
       WHERE internship_id = $1 AND status = 'open'`,
      [internshipId]
    );

    if (internship.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Open internship not found." },
        { status: 404 }
      );
    }

    const result = await db.query(
      `INSERT INTO saved_internships (student_id, internship_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, internship_id) DO NOTHING
       RETURNING student_id, internship_id, saved_at`,
      [studentId, internshipId]
    );

    return NextResponse.json({
      success: true,
      message: result.rowCount
        ? "Internship saved successfully."
        : "Internship is already saved.",
      saved: true,
    });
  } catch (error) {
    console.error("Save internship error:", error);

    return NextResponse.json(
      { success: false, error: "Could not save internship." },
      { status: 500 }
    );
  }
}

// DELETE: Remove a saved internship
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const studentId = Number(id);
    const { searchParams } = new URL(request.url);
    const internshipId = Number(searchParams.get("internship_id"));

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

    const auth = await authorizeStudent(studentId);

    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const result = await db.query(
      `DELETE FROM saved_internships
       WHERE student_id = $1 AND internship_id = $2
       RETURNING internship_id`,
      [studentId, internshipId]
    );

    return NextResponse.json({
      success: true,
      message: result.rowCount
        ? "Internship removed from saved list."
        : "Internship was not saved.",
      saved: false,
    });
  } catch (error) {
    console.error("Remove saved internship error:", error);

    return NextResponse.json(
      { success: false, error: "Could not remove saved internship." },
      { status: 500 }
    );
  }
}
