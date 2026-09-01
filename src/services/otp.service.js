import {
  generateOtp,
  hashOtp,
  compareOtp,
  getOtpExpiry,
} from "../utils/otp.js";

const MAX_OTP_ATTEMPTS = 5;

export async function generateVerificationOtp(userId, prisma) {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = getOtpExpiry();

  await prisma.otpVerification.create({
    data: {
      userId,
      otpHash,
      expiresAt,
    },
  });

  return {
    success: true,
    otp,
    expiresAt,
  };
}

export async function verifyOtp(userId, otp, prisma) {
  const verification = await prisma.otpVerification.findFirst({
    where: {
      userId,
      usedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verification) {
    return {
      success: false,
      status: 400,
      message: "No active OTP found",
    };
  }

  if (verification.expiresAt <= new Date()) {
    return {
      success: false,
      status: 400,
      message: "OTP has expired",
    };
  }

  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    return {
      success: false,
      status: 429,
      message: "Maximum OTP attempts exceeded",
    };
  }

  const isValid = await compareOtp(otp, verification.otpHash);

  if (!isValid) {
    await prisma.otpVerification.update({
      where: {
        id: verification.id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    return {
      success: false,
      status: 400,
      message: "Invalid OTP",
    };
  }

  await prisma.otpVerification.update({
    where: {
      id: verification.id,
    },
    data: {
      usedAt: new Date(),
    },
  });

  return {
    success: true,
    status: 200,
    message: "OTP verified successfully",
  };
}