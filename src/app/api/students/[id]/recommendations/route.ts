
import { NextRequest, NextResponse } from "next/server";
import { getStudentSession } from "@/lib/student-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SEMANTIC_API_URL =
  process.env.SEMANTIC_API_URL || "http://127.0.0.1:8001";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID." },
        { status: 400 }
      );
    }

    // Verify student session
    const session = await getStudentSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Please log in first." },
        { status: 401 }
      );
    }

    if (String(session.userId) !== id) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot access another student's data.",
        },
        { status: 403 }
      );
    }

    // Fetch AI recommendations
    const response = await fetch(
      `${SEMANTIC_API_URL}/recommend/${id}`,
      {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.detail || "Could not generate AI recommendations.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("AI recommendation API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "AI recommendation service is unavailable.",
      },
      { status: 503 }
    );
  }
}
