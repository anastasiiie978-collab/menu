import "server-only";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { readAdminSession } from "@/lib/session";

/** Thrown when ADMIN_PASSWORD_HASH is missing or is not a hash at all. */
export class AuthConfigError extends Error {}

// `$2b$10$` followed by the 53-character salt+digest bcrypt always produces.
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export async function checkAdminPassword(candidate: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new AuthConfigError("ADMIN_PASSWORD_HASH is not set");
  }

  // Checked rather than assumed, because the failure it catches is invisible
  // otherwise: `bcrypt.compare` returns false for a hash it cannot parse, exactly
  // as it does for a wrong password, so a mangled value means the correct password
  // is rejected forever with "Noto'g'ri parol" and nothing anywhere says why.
  //
  // The realistic way to get there: `.env.local` has to write the hash as
  // `\$2b\$10\$...` because Next's env loader would otherwise read `$2b` as a
  // variable reference — but that loader only runs on `.env*` files. Paste the
  // same escaped string into a hosting provider's environment-variable UI and the
  // backslashes survive into `process.env`, and login stops working in production
  // while still working locally.
  if (!BCRYPT_HASH.test(hash)) {
    const escaped = hash.includes("\\");
    throw new AuthConfigError(
      escaped
        ? "ADMIN_PASSWORD_HASH contains backslashes. The `\\$` escaping is only for .env files — paste the raw $2b$10$... hash into the hosting provider's environment variables."
        : "ADMIN_PASSWORD_HASH is not a bcrypt hash. It must look like $2b$10$ followed by 53 characters."
    );
  }

  return bcrypt.compare(candidate, hash);
}

export const verifyAdminSession = cache(async () => {
  const session = await readAdminSession();
  return session?.admin === true;
});
