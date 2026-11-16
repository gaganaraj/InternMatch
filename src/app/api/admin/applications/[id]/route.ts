
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const allowedStatuses = [
  "submitted",
  "under_review",
  "shortlisted",
  "rejected",
  "accepted",
  "withdrawn",
];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
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
        { error: "Invalid application ID." },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "Invalid application status." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `UPDATE applications
       SET status = $1
       WHERE application_id = $2
       RETURNING application_id, status`,
      [body.status, Number(id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application status updated successfully.",
      application: result.rows[0],
    });
  } catch (error) {
    console.error("Application status update:", error);
    return NextResponse.json(
      { error: "Could not update application status." },
      { status: 500 }
    );
  }
}
