import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

const adminCookieName = "dhyan_admin_session";

function sanitizeSecret(value: string) {
  const trimmed = value.trim();
  const normalized = trimmed.replace(/\\([\\$"'`])/g, "$1");

  if (
    (normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'"))
  ) {
    return normalized.slice(1, -1).trim();
  }

  return normalized;
}

function getAdminSecret() {
  const raw = process.env.ADMIN_ACCESS_KEY;
  if (!raw) {
    return "change-this-admin-key";
  }
  return sanitizeSecret(raw);
}

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function compareHash(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdminKeyConfigured() {
  return Boolean(process.env.ADMIN_ACCESS_KEY?.trim());
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get(adminCookieName)?.value;
  if (!session) {
    return false;
  }

  const secret = getAdminSecret();
  const expectedHash = hashSecret(secret);

  // Legacy support for older plaintext cookie format.
  if (session === secret) {
    return true;
  }

  return compareHash(session, expectedHash);
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, hashSecret(getAdminSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function validateAdminPassword(password: string) {
  const submitted = sanitizeSecret(password);
  const secret = getAdminSecret();
  return compareHash(hashSecret(submitted), hashSecret(secret));
}
