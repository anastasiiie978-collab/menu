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

const url = requireEnv("SUPABASE_URL");

export const DISH_PHOTOS_BUCKET = "dish-photos";

export const supabasePublic = createClient(url, requireEnv("SUPABASE_ANON_KEY"), {
  auth: { persistSession: false },
});

export const supabaseAdmin = createClient(url, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
