import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabaseClient";
import { DEFAULT_THEME_ID, isThemeId, type ThemeId } from "@/lib/themes";

// Where the manager's theme choice lives.
//
// It has to be server-side state, not a cookie: the point of the setting is that
// every customer who scans the QR code sees the background the restaurant picked,
// and a cookie would only ever restyle the manager's own phone.
//
// A `site_settings` table would be the tidier home for it, but PostgREST exposes
// no DDL, so creating one means someone pasting SQL into the Supabase dashboard
// before the button in the admin panel does anything. Storage buckets *can* be
// created with the service-role key, so this uses one and provisions it on the
// first save — the feature works the moment the code deploys, with no setup step
// that can be forgotten and no half-broken state to explain to a manager
// mid-shift.
//
// The bucket is private deliberately. A public object is served through the CDN
// with a cache lifetime of its own, so switching themes would keep showing the
// old one to customers for as long as an hour; reads through the service-role key
// hit the origin and are immediate.

const BUCKET = "site-config";
const OBJECT = "theme.json";

// Small process-level cache so a page render doesn't pay a storage round trip
// each time. Short enough that a manager who switches the theme and reloads the
// public menu sees the change straight away, long enough to absorb a burst of
// requests when a table of customers all scan the code at once. `revalidatePath`
// alone can't do this job: it clears Next's render cache, not this module's.
const TTL_MS = 15_000;
let memo: { themeId: ThemeId; readAt: number } | null = null;

function now() {
  return Date.now();
}

async function readThemeFromStorage(): Promise<ThemeId> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(OBJECT);

  // Bucket or object not there yet — the expected state until the first save, so
  // it is not worth logging. Anything else is worth seeing in the function logs,
  // but never worth failing a customer's page render over: a menu in the wrong
  // shade of brown still feeds people, a 500 does not.
  if (error || !data) return DEFAULT_THEME_ID;

  try {
    const parsed: unknown = JSON.parse(await data.text());
    const themeId =
      typeof parsed === "object" && parsed !== null
        ? (parsed as { themeId?: unknown }).themeId
        : undefined;
    // Validated rather than trusted. Only this module writes the file, but an
    // unrecognised id would otherwise reach `data-theme` and render a page with
    // no color variables defined at all.
    return isThemeId(themeId) ? themeId : DEFAULT_THEME_ID;
  } catch (err) {
    console.error("Site settings: theme.json is not valid JSON, using the default theme:", err);
    return DEFAULT_THEME_ID;
  }
}

/**
 * The theme every page should render in. `cache` collapses the several calls a
 * single render makes (layout + viewport metadata) into one.
 */
export const getActiveThemeId = cache(async (): Promise<ThemeId> => {
  if (memo && now() - memo.readAt < TTL_MS) return memo.themeId;

  try {
    const themeId = await readThemeFromStorage();
    memo = { themeId, readAt: now() };
    return themeId;
  } catch (err) {
    // Network-level failure. Cache the fallback too, so an outage doesn't mean a
    // failed storage call on every single render.
    console.error("Site settings: could not read the active theme:", err);
    memo = { themeId: DEFAULT_THEME_ID, readAt: now() };
    return DEFAULT_THEME_ID;
  }
});

export class SiteSettingsError extends Error {}

/** Persists the manager's choice. Throws `SiteSettingsError` on failure. */
export async function setActiveThemeId(themeId: ThemeId): Promise<void> {
  // Idempotent: after the first save this call just returns "already exists",
  // which is not an error worth surfacing.
  const { error: bucketError } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: false,
  });
  if (bucketError && !/exist/i.test(bucketError.message)) {
    console.error("Site settings: could not create the config bucket:", bucketError);
    throw new SiteSettingsError(bucketError.message);
  }

  const body = JSON.stringify({ themeId, updatedAt: new Date().toISOString() });
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(OBJECT, new Blob([body], { type: "application/json" }), {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) {
    console.error("Site settings: could not save the active theme:", error);
    throw new SiteSettingsError(error.message);
  }

  // Make this instance's next render use the new value instead of waiting out
  // the TTL. Other instances catch up within TTL_MS.
  memo = { themeId, readAt: now() };
}
