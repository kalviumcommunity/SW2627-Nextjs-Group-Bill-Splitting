import { registerUser } from "../../../../services/auth.service";
import { generateVerificationOtp } from "../../../../services/otp.service";
import { sendVerificationOtp } from "../../../../services/email.service";
import { prisma } from "../../../../lib/prisma";

export async function POST(request) {
  try {
    const body = await request.json();

    const result = await registerUser(body, prisma);
    if (!result.success) {
      return Response.json(result, { status: result.status });
    }

    const otpResult = await generateVerificationOtp(result.user.id, prisma);
    await sendVerificationOtp(result.user.email, otpResult.otp);

    return Response.json({
      success: true,
      message: "Registration successful. OTP sent to email.",
      userId: result.user.id,
      email: result.user.email,
    }, { status: 201 });
  } catch (error) {
    console.error("Registration API error:", error);

    return Response.json(
      { success: false, message: "Unable to complete registration" },
      { status: error?.code === "P2002" ? 409 : 500 }
    );
  }
}