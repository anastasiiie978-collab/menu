import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseClient";

// Deliberately stored in Supabase rather than a module-level Map. On Vercel each
// request may hit a different (or freshly cold-started) serverless instance, so
// in-memory counters reset constantly and would give the appearance of rate
// limiting without actually providing it.

const WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_IP = 5;

export type RateLimitVerdict =
  | { allowed: true }
  | { allowed: false; reason: "locked"; retryAfterMinutes: number }
  | { allowed: false; reason: "unavailable" };

/**
 * Identifies the caller by a keyed hash of their IP. Storing raw IPs would mean
 * keeping a log of every person who touched the admin page; the HMAC lets us
 * count repeat offenders without retaining the address itself.
 *
 * Header choice matters for a rate limit: a client can prepend a fake entry to
 * `x-forwarded-for` and, if we trusted its leftmost value, rotate that fake IP to
 * get a fresh bucket on every request — defeating the limit entirely. Vercel sets
 * `x-vercel-forwarded-for` and `x-real-ip` itself and strips any inbound `x-vercel-*`
 * a client tries to send, so those reflect the true client and cannot be forged.
 * We prefer them and only fall back to `x-forwarded-for` for local/other hosts.
 */
export async function getClientFingerprint(): Promise<string> {
  const headerList = await headers();
  const ip =
    headerList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip")?.trim() ||
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(ip).digest("hex");
}

export async function checkLoginRateLimit(fingerprint: string): Promise<RateLimitVerdict> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabaseAdmin
      .from("admin_login_attempts")
      .select("created_at")
      .eq("ip_hash", fingerprint)
      .eq("succeeded", false)
      .gte("created_at", since)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const failures = data ?? [];
    if (failures.length < MAX_FAILURES_PER_IP) return { allowed: true };

    // Unlock once the oldest failure in the window ages out.
    const oldest = new Date(failures[0].created_at).getTime();
    const unlocksAt = oldest + WINDOW_MINUTES * 60 * 1000;
    const retryAfterMinutes = Math.max(1, Math.ceil((unlocksAt - Date.now()) / 60000));
    return { allowed: false, reason: "locked", retryAfterMinutes };
  } catch (err) {
    // Fail closed. If Supabase is unreachable the admin panel is useless anyway
    // (every screen reads from it), so refusing logins costs nothing real and
    // avoids turning an outage into an open door for guessing.
    console.error("Login rate-limit check failed:", err);
    return { allowed: false, reason: "unavailable" };
  }
}

export async function recordLoginAttempt(fingerprint: string, succeeded: boolean): Promise<void> {
  try {
    await supabaseAdmin.from("admin_login_attempts").insert({ ip_hash: fingerprint, succeeded });

    if (succeeded) {
      // A correct password clears the slate so one forgetful session doesn't
      // leave the real admin near the limit for the rest of the window.
      await supabaseAdmin
        .from("admin_login_attempts")
        .delete()
        .eq("ip_hash", fingerprint)
        .eq("succeeded", false);
    }

    // Opportunistic cleanup — keeps the table from growing without bound
    // without needing a scheduled job.
    if (Math.random() < 0.02) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await supabaseAdmin.from("admin_login_attempts").delete().lt("created_at", cutoff);
    }
  } catch (err) {
    // Never block a legitimate login because bookkeeping failed.
    console.error("Failed to record login attempt:", err);
  }
}
