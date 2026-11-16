
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyPassword,
  createAdminSession,
} from "@/lib/admin-auth";

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
       WHERE LOWER(email) = $1 AND role = 'admin'`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const admin = result.rows[0];

    const validPassword = await verifyPassword(
      password,
      admin.password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await createAdminSession(Number(admin.user_id));

    return NextResponse.json({
      success: true,
      message: "Admin login successful.",
      admin: {
        user_id: Number(admin.user_id),
        email: admin.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to process admin login." },
      { status: 500 }
    );
  }
}
