
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.query(`
      SELECT
        a.application_id,
        a.student_id,
        a.internship_id,
        a.status,
        a.applied_at,
        u.email,
        sp.full_name,
        sp.education,
        sp.graduation_year,
        i.title AS internship_title,
        i.company_name,
        i.location,
        i.work_mode,
        i.stipend
      FROM applications a
      JOIN student_profiles sp ON sp.user_id = a.student_id
      JOIN users u ON u.user_id = a.student_id
      JOIN internships i ON i.internship_id = a.internship_id
      ORDER BY a.applied_at DESC, a.application_id DESC
    `);

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      applications: result.rows,
    });
  } catch (error) {
    console.error("Admin applications GET:", error);
    return NextResponse.json(
      { error: "Could not load applications." },
      { status: 500 }
    );
  }
}
