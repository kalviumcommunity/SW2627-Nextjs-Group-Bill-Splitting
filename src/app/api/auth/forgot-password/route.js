import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetOtp } from "../../../../services/otp.service";
import { sendPasswordResetOtp } from "../../../../services/email.service";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account found with this email address" },
        { status: 404 }
      );
    }

    const otpResult = await generatePasswordResetOtp(user.id, prisma);
    await sendPasswordResetOtp(user.email, otpResult.otp);

    return NextResponse.json({
      success: true,
      message: "A 6-digit password reset code has been sent to your email",
      email: user.email,
      userId: user.id,
    });
  } catch (error) {
    console.error("Forgot password API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to process password reset request" },
      { status: 500 }
    );
  }
}
