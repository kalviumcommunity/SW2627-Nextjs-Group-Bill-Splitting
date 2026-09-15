import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, exists: false, message: "Email parameter is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        exists: false,
        message: `No registered account found for "${email}". Only registered users can be added to a split.`,
      });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      user,
    });
  } catch (error) {
    console.error("User check error:", error);
    return NextResponse.json(
      { success: false, exists: false, message: "Unable to check user" },
      { status: 500 }
    );
  }
}
