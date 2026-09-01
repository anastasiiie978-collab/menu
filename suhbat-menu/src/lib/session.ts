import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "suhbat_admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// HS256 keys shorter than the 256-bit hash they feed are the classic way a
// signed-cookie scheme ends up brute-forceable offline: `jose` will happily sign
// with whatever bytes it is handed, so a placeholder like "changeme" left in an
// environment variable produces tokens that look identical to real ones. 32
// characters is the floor for the hex/base64 output of every standard way of
// generating one (`openssl rand -hex 32`, `crypto.randomUUID()` twice over).
const MIN_SESSION_SECRET_LENGTH = 32;

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  if (secret.length < MIN_SESSION_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be at least ${MIN_SESSION_SECRET_LENGTH} characters. Generate one with: openssl rand -hex 32`
    );
  }
  return new TextEncoder().encode(secret);
}

type SessionPayload = {
  admin: true;
  expiresAt: string;
};

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

async function decrypt(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function createAdminSession() {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encrypt({ admin: true, expiresAt: expiresAt.toISOString() });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function readAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return decrypt(token);
}

/**
 * Verifies a session token that the caller already has in hand.
 *
 * Exists for proxy.ts. `cookies()` from `next/headers` is documented for Server
 * Components, Server Functions and Route Handlers — Proxy is none of those, and
 * although it happens to work there today, "the auth redirect quietly stops
 * firing" is not a way to discover that a Next release tightened it. Proxy has
 * `request.cookies`; this gives it something to hand the token to.
 */
export async function verifySessionToken(token: string | undefined) {
  return decrypt(token);
}

export { SESSION_COOKIE };
