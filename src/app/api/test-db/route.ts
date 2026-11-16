
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(
      "SELECT current_database() AS database, COUNT(*)::int AS internship_count FROM internships"
    );

    return NextResponse.json({
      success: true,
      message: "PostgreSQL connection successful!",
      database: result.rows[0].database,
      internshipCount: result.rows[0].internship_count,
    });
  } catch (error) {
    console.error("Database connection test failed:", error);

    return NextResponse.json(
      { success: false, message: "Database connection failed. Check server logs." },
      { status: 500 }
    );
  }
}
