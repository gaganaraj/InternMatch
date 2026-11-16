
import { NextResponse } from "next/server";
import { destroyAdminSession, getAdminSession } from "@/lib/admin-auth";

export async function POST() {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await destroyAdminSession();

  return NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });
}
