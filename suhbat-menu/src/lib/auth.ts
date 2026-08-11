import "server-only";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { readAdminSession } from "@/lib/session";

export function checkAdminPassword(candidate: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    throw new Error("ADMIN_PASSWORD_HASH is not set");
  }
  return bcrypt.compare(candidate, hash);
}

export const verifyAdminSession = cache(async () => {
  const session = await readAdminSession();
  return session?.admin === true;
});
