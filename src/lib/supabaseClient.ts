import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;

export const DISH_PHOTOS_BUCKET = "dish-photos";

export const supabasePublic = createClient(url, process.env.SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});

export const supabaseAdmin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
