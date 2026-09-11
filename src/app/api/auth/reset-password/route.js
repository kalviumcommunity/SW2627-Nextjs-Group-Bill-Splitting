import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPasswordResetOtp } from "../../../../services/otp.service";
import { hashPassword } from "../../../../utils/password";
import { validateResetPasswordInput } from "../../../../utils/auth.validation";

export async function POST(request) {
  try {
    const body = await request.json();
    const validation = validateResetPasswordInput(body);

    if (!validation.isValid) {
      const firstErrorMessage = Object.values(validation.errors)[0] || "Invalid input";
      return NextResponse.json(
        {
          success: false,
          message: firstErrorMessage,
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const { email, userId, otp, newPassword } = validation.data;

    // Resolve user
    let resolvedUserId = userId;
    if (!resolvedUserId && email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Unable to reset password" },
          { status: 400 }
        );
      }
      resolvedUserId = user.id;
    }

    if (!resolvedUserId) {
      return NextResponse.json(
        { success: false, message: "Unable to reset password" },
        { status: 400 }
      );
    }

    // Verify the OTP
    const otpResult = await verifyPasswordResetOtp(resolvedUserId, otp, prisma);
    if (!otpResult.success) {
      return NextResponse.json(otpResult, { status: otpResult.status });
    }

    // Update the password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: resolvedUserId },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to reset password" },
      { status: 500 }
    );
  }
}
