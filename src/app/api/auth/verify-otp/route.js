import { verifyOtp } from "../../../../services/otp.service";
import { validateOtpInput } from "../../../../utils/auth.validation";

export async function POST(request) {
  try {
    const body = await request.json();

    const validation = validateOtpInput(body);

    if (!validation.isValid) {
      return Response.json(
        {
          success: false,
          errors: validation.errors,
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: false,
        message: "Database connection is not configured yet",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("OTP verification API error:", error);

    return Response.json(
      {
        success: false,
        message: "Invalid request",
      },
      { status: 400 }
    );
  }
}