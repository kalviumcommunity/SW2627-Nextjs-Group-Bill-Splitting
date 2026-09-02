import crypto from "crypto";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

export function generateOtp() {
  const max = 10 ** OTP_LENGTH;

  return crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, "0");
}

export async function hashOtp(otp) {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");
}

export async function compareOtp(otp, otpHash) {
  const hashedOtp = await hashOtp(otp);

  return crypto.timingSafeEqual(
    Buffer.from(hashedOtp),
    Buffer.from(otpHash)
  );
}

export function getOtpExpiry() {
  return new Date(
    Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000
  );
}