
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyPassword,
  createStudentSession,
} from "@/lib/student-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `SELECT user_id, email, password_hash
       FROM users
       WHERE LOWER(email) = $1 AND role = 'student'`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const student = result.rows[0];

    const validPassword = await verifyPassword(
      password,
      student.password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await createStudentSession(Number(student.user_id));

    return NextResponse.json({
      success: true,
      message: "Student login successful.",
      student: {
        user_id: Number(student.user_id),
        email: student.email,
        role: "student",
      },
    });
  } catch (error) {
    console.error("Student login error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to process student login." },
      { status: 500 }
    );
  }
}
