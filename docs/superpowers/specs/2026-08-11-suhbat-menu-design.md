# Suhbat Menu Website — Design Spec

Date: 2026-08-11
Status: Approved by user in conversation, building now.

## Context

Suhbat is a national Uzbek cuisine restaurant (est. 2017), Instagram
`@suhbat_milliytaomlar`. A printed QR table-tent card (slide 4 of
`Suhbat-menyu.pptx`) will link to this site. Scanning it must show a
two-choice screen: Instagram or the full menu. The PPTX/Google Slides deck
already carries real menu content, real prices, and an explicit art
direction in its speaker notes (dark background, moody dark-plate food
photography, gold accents, one hero photo per category panel).

## Goals

- QR landing screen with exactly two choices: Instagram, or "Suhbat menyu".
- A fast, animated, mobile-first public menu (39 dishes, 4 categories)
  built from the real PPTX content.
- An admin panel: add/edit/delete dishes, change name/price/photo, toggle
  sold-out.
- No customer accounts, no auth for the public site, no QR code rendered
  anywhere inside the website itself (only on the physical printed card).
- Must run instantly from a local folder with zero external accounts to
  set up before the user can click through it.

## Stack

Next.js (App Router) + TypeScript + Tailwind, one codebase, in this folder
(`C:\Users\user\Desktop\Cafe`).

**Deviation from what was discussed in chat:** Supabase was the original
recommendation for the database. Switched to a local JSON file
(`data/dishes.json`) + local image folder (`public/uploads/dishes`)
instead, because the explicit ask was "open a local folder where I will
test it myself" with "not that much database" and "no auth" for the
public side — a JSON file needs no signup, no API keys, no waiting on
external provisioning, and is human-readable (fits "one place to look
when it breaks"). Trade-off: on typical serverless hosts (Netlify/Vercel)
a local file/folder does not persist writes across deploys. The data
layer is isolated behind `lib/dishes.ts` so swapping to a hosted
Postgres + Storage (e.g. Supabase) later, when this actually goes live,
is a contained change to one module, not a rewrite.

Admin auth: single shared password (bcrypt hash in `.env.local`), signed
session cookie (`jose`), no user table, no customer database.

## Data model

`data/dishes.json`:
```
{
  categories: [{ id, slug, name, sortOrder }],
  dishes: [{
    id, categoryId, name, description, price, priceUnit,
    photoUrl, soldOut, sortOrder, createdAt, updatedAt
  }]
}
```

Categories are seeded once from the deck (Birinchi taomlar, Ikkinchi
taomlar, Shashliklar, Salatlar) and are not exposed in the admin UI —
only dish management was requested. Dishes are fully CRUD-able.

## Pages

- `/` — two large tap targets (≥44px): Instagram icon+label → external
  link to `instagram.com/suhbat_milliytaomlar`; "Suhbat menyu" → `/menu`.
- `/menu` — sticky category jump-nav, all 39 dishes in one continuous
  scroll, alternating photo/name layout, scroll-reveal animation,
  shashlik items keep their "1 sixga" (per skewer) unit label, sold-out
  dishes shown dimmed with a badge rather than hidden.
- `/admin` — password login.
- `/admin/dashboard` — dish list grouped by category: inline edit,
  add-new, delete (confirm), sold-out toggle, photo upload (saved to
  `public/uploads/dishes`, form falls back to a themed placeholder tile
  if no photo).

## Images

Real dish photos don't exist yet. Rather than scraping Google Images
(copyright risk for a commercial site), seed data uses free-to-use stock
photography (Unsplash/Pexels, no attribution required) matched per
category — soups, grilled meat/shashlik, manti, lag'mon, braised mains,
salads. Admin replaces these with real photos whenever ready.

## Design tokens (extracted from the deck)

- Backgrounds: `#121212` canvas, `#1A1A1A` surface, `#2C2C2C` panel,
  `#3A3A3A` panel-2
- Gold accent: `#C8A24A`, light gold `#E0C485`
- Text: `#F2EDE4` primary, `#9A938A` / `#807A72` muted
- Fonts: Oswald (headings/labels), Jost (body/UI), Cormorant Garamond
  (elegant serif accents) — via `next/font/google`, self-hosted (no
  external font request lag)
- Radius/motion: rounded photo frames (matches the deck's rounded
  corners), subtle scroll-reveal fade/slide, no gradients/glassmorphism

## Error handling

- Missing photo → themed placeholder tile, never a broken-image icon.
- Admin upload failure → inline error, form keeps entered values.
- Data file unreadable → public menu shows a friendly Uzbek "vaqtincha
  ochilmayapti" message instead of crashing.
- Expired/missing admin session → redirect to `/admin` login.

## Testing

Manual verification in-browser (desktop + 375px mobile) covering: both
landing buttons, menu scroll/animation/category-jump, full admin CRUD
round trip, image upload, sold-out toggle. No automated test suite for
this scope (39 static-shape records, no complex logic) — can add
Playwright smoke tests later if the menu grows or regressions appear.
After the build, two agents independently role-play as customers on the
live local site to catch bugs/rough edges before considering this done.

## Out of scope (explicitly, for now)

- Category add/rename/reorder in admin (categories are fixed, seeded
  once).
- Customer accounts, ratings, ordering/checkout.
- Real hosting/deploy (Netlify/Vercel + swap to hosted DB) — architecture
  supports it later without a rewrite, but not built now.
