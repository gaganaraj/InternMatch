
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

// UPDATE INTERNSHIP
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid internship ID." },
        { status: 400 }
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
      UPDATE internships
      SET
        title = $1,
        company_name = $2,
        description = $3,
        location = $4,
        work_mode = $5,
        internship_type = $6,
        stipend = $7,
        eligibility_criteria = $8,
        deadline = $9,
        status = $10
      WHERE internship_id = $11
      RETURNING *
      `,
      [
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
        Number(id),
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Internship not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Internship updated successfully.",
      internship: result.rows[0],
    });
  } catch (error) {
    console.error("Admin internship PUT error:", error);

    return NextResponse.json(
      { error: "Could not update internship." },
      { status: 500 }
    );
  }
}

// DELETE INTERNSHIP
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid internship ID." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      DELETE FROM internships
      WHERE internship_id = $1
      RETURNING internship_id
      `,
      [Number(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Internship not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Internship deleted successfully.",
    });
  } catch (error) {
    console.error("Admin internship DELETE error:", error);

    return NextResponse.json(
      {
        error: "Could not delete internship. It may have related applications or saved records.",
      },
      { status: 409 }
    );
  }
}
