import "server-only";
import { createClient } from "@supabase/supabase-js";

// Fail fast with a clear message instead of letting a missing/misspelled env
// var silently become `undefined`, which would otherwise surface later as an
// opaque runtime error deep inside a Supabase call (or a confusing
// "supabaseUrl is required" from the SDK) the first time a request comes in.
function requireEnv(name: "SUPABASE_URL" | "SUPABASE_ANON_KEY" | "SUPABASE_SERVICE_ROLE_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable "${name}". Set it in Vercel project settings (or .env.local for local dev).`
    );
  }
  return value;
}

// Exported so callers that need to recognise this project's own storage URLs
// (upload.ts, when deciding whether a photo URL is one of ours) share the same
// value instead of re-reading the environment and drifting from it.
export const supabaseUrl = requireEnv("SUPABASE_URL");
const url = supabaseUrl;

export const DISH_PHOTOS_BUCKET = "dish-photos";

export const supabasePublic = createClient(url, requireEnv("SUPABASE_ANON_KEY"), {
  auth: { persistSession: false },
});

export const supabaseAdmin = createClient(url, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
