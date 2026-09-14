import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import {
  SESSION_COOKIE_NAME,
  verifySessionValue,
} from "../../../../services/session.service";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = verifySessionValue(cookieStore.get(SESSION_COOKIE_NAME)?.value);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Current user API error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load current user" },
      { status: 500 }
    );
  }
}