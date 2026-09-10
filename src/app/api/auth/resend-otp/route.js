import { generateVerificationOtp } from "../../../../services/otp.service";
import { sendVerificationOtp } from "../../../../services/email.service";
import { prisma } from "../../../../lib/prisma";

export async function POST(request) {
  try {
    const { userId, email } = await request.json();
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { email: email?.trim().toLowerCase() } });

    if (!user || user.emailVerified) {
      return Response.json(
        { success: false, message: "Unable to resend verification code" },
        { status: 400 }
      );
    }

    const otpResult = await generateVerificationOtp(user.id, prisma);
    await sendVerificationOtp(user.email, otpResult.otp);

    return Response.json({
      success: true,
      message: `A new 6-digit code has been dispatched to ${user.email}`,
    });
  } catch (error) {
    console.error("OTP resend API error:", error);
    return Response.json(
      { success: false, message: "Unable to resend verification code" },
      { status: 500 }
    );
  }
}