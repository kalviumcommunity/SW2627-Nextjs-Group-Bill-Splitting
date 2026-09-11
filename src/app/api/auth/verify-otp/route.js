import { NextResponse } from "next/server";
import { verifyOtp } from "../../../../services/otp.service";
import { validateOtpInput } from "../../../../utils/auth.validation";
import { prisma } from "../../../../lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();

    const validation = validateOtpInput(body);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    const { userId, email, otp } = validation.data;
    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Unable to verify this account" },
          { status: 400 }
        );
      }
      resolvedUserId = user.id;
    }

    const result = await verifyOtp(resolvedUserId, otp, prisma);
    return NextResponse.json(result, { status: result.status });
  } catch (error) {
    console.error("OTP verification API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Invalid request",
      },
      { status: 400 }
    );
  }
}