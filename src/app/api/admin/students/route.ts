
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await db.query(`
      SELECT
        u.user_id,
        u.email,
        u.created_at,

        sp.full_name,
        sp.education,
        sp.graduation_year,
        sp.career_goals,
        sp.profile_text,

        COALESCE(sk.skills, '[]'::json) AS skills,
        COALESCE(pr.projects, '[]'::json) AS projects,
        COALESCE(ap.applications, '[]'::json) AS applications,
        COALESCE(ap.application_count, 0) AS application_count

      FROM users u

      LEFT JOIN student_profiles sp
        ON sp.user_id = u.user_id

      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'skill_id', s.skill_id,
            'skill_name', s.skill_name,
            'category', s.category,
            'proficiency', ss.proficiency
          )
          ORDER BY s.skill_name
        ) AS skills
        FROM student_skills ss
        JOIN skills s ON s.skill_id = ss.skill_id
        WHERE ss.user_id = u.user_id
      ) sk ON true

      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'project_id', p.project_id,
            'project_title', p.project_title,
            'description', p.description,
            'project_url', p.project_url
          )
          ORDER BY p.created_at DESC
        ) AS projects
        FROM projects p
        WHERE p.user_id = u.user_id
      ) pr ON true

      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS application_count,
          json_agg(
            json_build_object(
              'application_id', a.application_id,
              'internship_id', a.internship_id,
              'internship_title', i.title,
              'company_name', i.company_name,
              'status', a.status,
              'applied_at', a.applied_at
            )
            ORDER BY a.applied_at DESC
          ) AS applications
        FROM applications a
        LEFT JOIN internships i
          ON i.internship_id = a.internship_id
        WHERE a.student_id = u.user_id
      ) ap ON true

      WHERE u.role = 'student'
      ORDER BY u.created_at DESC, u.user_id DESC
    `);

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      students: result.rows,
    });

  } catch (error) {
    console.error("Admin students API error:", error);

    return NextResponse.json(
      { error: "Could not load student records." },
      { status: 500 }
    );
  }
}
