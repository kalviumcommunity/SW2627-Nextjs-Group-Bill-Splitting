import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "cred_split_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required for authentication sessions");
  }

  return process.env.AUTH_SECRET;
}

function sign(value) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createSessionValue(userId) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionValue(value) {
  if (!value) return null;

  const [userId, expiresAt, signature] = value.split(".");
  if (!userId || !expiresAt || !signature || Number(expiresAt) < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const expected = sign(`${userId}.${expiresAt}`);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  return userId;
}