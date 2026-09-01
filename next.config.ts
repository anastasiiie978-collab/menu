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
//
// Development needs two extras, and only development gets them. React's dev build
// calls eval() to rebuild stack traces across the server/client boundary, and
// Turbopack's hot reload runs over a websocket — under the production policy both
// are blocked, so `next dev` came with a console full of CSP errors, no hot
// reload, and no usable React error overlay. `next build` sets NODE_ENV to
// production, so nothing here can loosen what actually ships.
function contentSecurityPolicy(): string {
  const supabase = `https://${resolveSupabaseHostname()}`;
  const isDev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: " + supabase,
    "font-src 'self'",
    `connect-src 'self' ${supabase}${isDev ? " ws: wss:" : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  // Vercel serves this over HTTPS already, but nothing was telling the browser to
  // *remember* that. Without HSTS the very first request of a session — someone
  // typing the domain, or tapping a printed QR that encodes http:// — travels in
  // the clear and is downgradeable, admin login included. Two years, subdomains
  // included; not submitted to the preload list, which is a one-way door.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      // Server Actions cap a request body at 1MB by default, and dish photos
      // travel through one.
      // lib/upload.ts accepts images up to 5MB, so every photo between those two
      // numbers — which is most photos a phone takes — was rejected by the
      // framework before any of that validation ran, with a generic error. 6MB
      // leaves room for the multipart boundaries and part headers wrapped around a
      // 5MB file; the real limit stays the one in upload.ts, where it can explain
      // itself in Uzbek.
      bodySizeLimit: "6mb",
    },
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
