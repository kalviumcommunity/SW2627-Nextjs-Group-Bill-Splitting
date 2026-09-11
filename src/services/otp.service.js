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

  try {
    await prisma.otpVerification.create({
      data: {
        userId,
        otpHash,
        expiresAt,
        purpose: "EMAIL_VERIFICATION",
      },
    });
  } catch (err) {
    // Graceful fallback if purpose column does not exist in db/schema yet
    await prisma.otpVerification.create({
      data: {
        userId,
        otpHash,
        expiresAt,
      },
    });
  }

  return {
    success: true,
    otp,
    expiresAt,
  };
}

export async function generatePasswordResetOtp(userId, prisma) {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = getOtpExpiry();

  try {
    await prisma.otpVerification.create({
      data: {
        userId,
        otpHash,
        expiresAt,
        purpose: "PASSWORD_RESET",
      },
    });
  } catch (err) {
    // Graceful fallback if purpose column does not exist in db/schema yet
    await prisma.otpVerification.create({
      data: {
        userId,
        otpHash,
        expiresAt,
      },
    });
  }

  return {
    success: true,
    otp,
    expiresAt,
  };
}

export async function verifyOtp(userId, otp, prisma) {
  let verification;
  try {
    verification = await prisma.otpVerification.findFirst({
      where: {
        userId,
        usedAt: null,
        purpose: "EMAIL_VERIFICATION",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (err) {
    verification = null;
  }

  if (!verification) {
    verification = await prisma.otpVerification.findFirst({
      where: {
        userId,
        usedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

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

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });

  return {
    success: true,
    status: 200,
    message: "OTP verified successfully",
  };
}

export async function verifyPasswordResetOtp(userId, otp, prisma) {
  let verification;
  try {
    verification = await prisma.otpVerification.findFirst({
      where: {
        userId,
        usedAt: null,
        purpose: "PASSWORD_RESET",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (err) {
    verification = null;
  }

  if (!verification) {
    verification = await prisma.otpVerification.findFirst({
      where: {
        userId,
        usedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  if (!verification) {
    return {
      success: false,
      status: 400,
      message: "No active reset code found. Please request a new one.",
    };
  }

  if (verification.expiresAt <= new Date()) {
    return {
      success: false,
      status: 400,
      message: "Reset code has expired. Please request a new one.",
    };
  }

  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    return {
      success: false,
      status: 429,
      message: "Too many failed attempts. Please request a new code.",
    };
  }

  const isValid = await compareOtp(otp, verification.otpHash);

  if (!isValid) {
    await prisma.otpVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });

    return {
      success: false,
      status: 400,
      message: "Invalid reset code",
    };
  }

  // Mark OTP as used
  await prisma.otpVerification.update({
    where: { id: verification.id },
    data: { usedAt: new Date() },
  });

  return {
    success: true,
    status: 200,
    message: "Reset code verified successfully",
  };
}