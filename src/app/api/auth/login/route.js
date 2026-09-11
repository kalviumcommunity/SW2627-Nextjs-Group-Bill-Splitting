import { loginUser } from "../../../../services/auth.service";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  createSessionValue,
  SESSION_COOKIE_NAME,
} from "../../../../services/session.service";

export async function POST(request) {
  try {
    const body = await request.json();

    const result = await loginUser(body, prisma);
    if (!result.success) {
      return NextResponse.json(result, { status: result.status });
    }

    const response = NextResponse.json(result, { status: 200 });
    response.cookies.set(SESSION_COOKIE_NAME, createSessionValue(result.user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to authenticate" },
      { status: 500 }
    );
  }
}