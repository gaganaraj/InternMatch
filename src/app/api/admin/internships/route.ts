
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function validateInternship(body: any): boolean {
  return (
    typeof body.title === "string" &&
    !!body.title.trim() &&
    typeof body.company_name === "string" &&
    !!body.company_name.trim() &&
    typeof body.description === "string" &&
    !!body.description.trim() &&
    ["onsite", "remote", "hybrid"].includes(body.work_mode) &&
    ["paid", "unpaid", "stipend"].includes(body.internship_type) &&
    ["draft", "open", "closed"].includes(body.status) &&
    (
      body.stipend === null ||
      body.stipend === "" ||
      (
        Number.isFinite(Number(body.stipend)) &&
        Number(body.stipend) >= 0
      )
    )
  );
}

// GET ALL INTERNSHIPS
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
      SELECT *
      FROM internships
      ORDER BY created_at DESC, internship_id DESC
    `);

    return NextResponse.json({
      success: true,
      internships: result.rows,
    });
  } catch (error) {
    console.error("Admin internship GET error:", error);

    return NextResponse.json(
      { error: "Could not load internships." },
      { status: 500 }
    );
  }
}

// ADD INTERNSHIP
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!validateInternship(body)) {
      return NextResponse.json(
        { error: "Invalid internship details." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      INSERT INTO internships (
        posted_by,
        title,
        company_name,
        description,
        location,
        work_mode,
        internship_type,
        stipend,
        eligibility_criteria,
        deadline,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        admin.userId,
        body.title.trim(),
        body.company_name.trim(),
        body.description.trim(),
        body.location?.trim() || null,
        body.work_mode,
        body.internship_type,
        body.stipend === "" || body.stipend === null
          ? null
          : Number(body.stipend),
        body.eligibility_criteria?.trim() || null,
        body.deadline || null,
        body.status,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Internship created successfully.",
        internship: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin internship POST error:", error);

    return NextResponse.json(
      { error: "Could not create internship." },
      { status: 500 }
    );
  }
}
