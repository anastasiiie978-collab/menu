import type { NextConfig } from "next";
import path from "node:path";

// Known-good fallback for local dev / any build phase where SUPABASE_URL
// isn't populated yet. Kept in sync with the live project, but the block
// below derives the real hostname from SUPABASE_URL whenever it's set so a
// future project migration (new Supabase project ref) doesn't silently
// break `next/image` for dish photos.
const FALLBACK_SUPABASE_HOSTNAME = "serpkwiqmgefwgtskhae.supabase.co";

function resolveSupabaseHostname(): string {
  const raw = process.env.SUPABASE_URL;
  if (!raw) return FALLBACK_SUPABASE_HOSTNAME;
  try {
    return new URL(raw).hostname;
  } catch {
    // Malformed SUPABASE_URL — fall back rather than crashing the build;
    // supabaseClient.ts is the source of truth for hard-failing on this.
    return FALLBACK_SUPABASE_HOSTNAME;
  }
}

// Content-Security-Policy. Scoped as tightly as an App Router app allows:
//   - script/style keep 'unsafe-inline' because Next injects inline hydration
//     scripts and inlines critical CSS; a nonce-based policy would need
//     per-request middleware wiring. XSS surface here is minimal anyway — all
//     dynamic text is React-escaped and nothing renders raw HTML.
//   - fonts are self-hosted by next/font at build time, so font-src is 'self'.
//   - img/connect are limited to self + the Supabase project (dish photos and,
//     defensively, any client call). data: covers the QR/inline SVGs.
//   - frame-ancestors 'none' + object-src 'none' + base-uri/form-action 'self'
//     close clickjacking, plugin, and base-tag/exfil-form vectors.
function contentSecurityPolicy(): string {
  const supabase = `https://${resolveSupabaseHostname()}`;
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: " + supabase,
    "font-src 'self'",
    "connect-src 'self' " + supabase,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: resolveSupabaseHostname(), pathname: "/storage/v1/object/public/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
