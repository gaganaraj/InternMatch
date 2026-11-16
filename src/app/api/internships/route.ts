
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.query(`
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
        COALESCE(
          json_agg(
            json_build_object(
              'skill_id', s.skill_id,
              'skill_name', s.skill_name,
              'is_mandatory', isk.is_mandatory
            )
          ) FILTER (WHERE s.skill_id IS NOT NULL),
          '[]'::json
        ) AS skills
      FROM internships i
      LEFT JOIN internship_skills isk
        ON isk.internship_id = i.internship_id
      LEFT JOIN skills s
        ON s.skill_id = isk.skill_id
      WHERE i.status = 'open'
      GROUP BY i.internship_id
      ORDER BY i.created_at DESC, i.internship_id DESC;
    `);

    return NextResponse.json({
      success: true,
      count: result.rows.length,
      internships: result.rows,
    });
  } catch (error) {
    console.error("Internships API error:", error);

    return NextResponse.json(
      { success: false, message: "Could not load internships." },
      { status: 500 }
    );
  }
}
