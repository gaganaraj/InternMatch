
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getStudentSession } from "@/lib/student-auth";

// GET: Retrieve the logged-in student's profile
export async function GET() {
  try {
    const session = await getStudentSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const result = await db.query(
      `SELECT
         u.user_id,
         u.email,
         sp.full_name,
         sp.education,
         sp.career_goals
       FROM users u
       LEFT JOIN student_profiles sp
         ON sp.user_id = u.user_id
       WHERE u.user_id = $1
         AND u.role = 'student'`,
      [session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Student profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      student: result.rows[0],
    });
  } catch (error) {
    console.error("Student profile retrieval error:", error);

    return NextResponse.json(
      { success: false, error: "Could not retrieve student profile." },
      { status: 500 }
    );
  }
}

// PUT: Update the logged-in student's profile
export async function PUT(request: Request) {
  try {
    const session = await getStudentSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const fullName =
      typeof body.full_name === "string" ? body.full_name.trim() : "";

    const education =
      typeof body.education === "string" ? body.education.trim() : "";

    const careerGoals =
      typeof body.career_goals === "string"
        ? body.career_goals.trim()
        : "";

    if (!fullName || !education || !careerGoals) {
      return NextResponse.json(
        {
          success: false,
          error: "All profile fields are required.",
        },
        { status: 400 }
      );
    }

    if (
      fullName.length > 150 ||
      education.length > 200 ||
      careerGoals.length > 1000
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more fields exceed the allowed length.",
        },
        { status: 400 }
      );
    }

    const result = await db.query(
      `UPDATE student_profiles
       SET
         full_name = $1,
         education = $2,
         career_goals = $3
       WHERE user_id = $4
       RETURNING user_id, full_name, education, career_goals`,
      [fullName, education, careerGoals, session.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Student profile not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      student: result.rows[0],
    });
  } catch (error) {
    console.error("Student profile update error:", error);

    return NextResponse.json(
      { success: false, error: "Could not update student profile." },
      { status: 500 }
    );
  }
}
