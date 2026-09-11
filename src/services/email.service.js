import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_FROM",
  ];

  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(", ")}`);
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

export async function sendVerificationOtp(email, otp) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Your CRED Split verification code",
    text: `Your CRED Split verification code is ${otp}. It expires in 10 minutes.`,
  });
}

export async function sendPasswordResetOtp(email, otp) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "CRED Split password reset code",
    text: `Your CRED Split password reset code is ${otp}. It expires in 10 minutes. If you did not request this, please ignore this email.`,
  });
}