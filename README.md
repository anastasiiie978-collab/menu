# Suhbat — milliy taomnoma

QR-code menu for the Suhbat restaurant. A printed table tent links here; scanning it
opens a two-choice landing screen (Instagram or the full menu), and the manager
edits dishes, categories and the site's background colour from a password-protected
admin panel.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Storage).

## Running it

```bash
npm install && npm run dev
```

Copy `.env.example` to `.env.local` and fill it in first — **read the comments in
that file**, particularly the one about escaping `$` in `ADMIN_PASSWORD_HASH`. The
escaping is required in `.env.local` and wrong in a hosting provider's
environment-variable UI, and getting it backwards rejects the correct password with
"Noto'g'ri parol" in production while everything still works locally.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run check:contrast` | Verifies all five themes against WCAG 2.2 AA (see below) |
| `npm run lint` | ESLint |

## Layout

```
src/app/            routes — / landing, /menu public menu, /admin* panel
src/app/admin/actions.ts   every mutation, each re-checking the session
src/lib/themes.ts   the five palettes, and every colour the UI uses
src/lib/dishes.ts   Supabase reads and writes
src/lib/upload.ts   photo validation (magic bytes, not just MIME) and cleanup
src/proxy.ts        login/logout redirects — a convenience, not the auth boundary
```

## Backgrounds

The admin panel's **Menyu foni** section switches the whole site — landing screen,
public menu and panel — between five palettes: `Ko'mir` (charcoal, the default),
`Tandir` (warm brown), `Samarqand` (indigo), `Anor` (deep pomegranate) and `Qog'oz`
(ivory, for reading in daylight).

A theme is not just a background colour. Each one in `src/lib/themes.ts` carries the
full token set — text, borders, accents, error colours — because a background is
only usable with text that stays readable on it. `npm run check:contrast` checks
every foreground/background pair the UI actually renders against WCAG 2.2 AA and
exits non-zero on a failure, so a future tweak to a hex value cannot quietly ship a
theme where the prices are unreadable. **Run it after touching any colour.**

The choice is stored server-side in a private Supabase Storage bucket
(`site-config/theme.json`), so it applies to every customer rather than to one
browser. The bucket is created automatically on the first save — no setup step. If
it can't be read, every page falls back to `Ko'mir` rather than failing.

## Notes for whoever works on this next

- **Every admin page and action verifies the session itself.** `src/proxy.ts` only
  handles redirects. Don't move authorization into it.
- **Only the service-role key writes.** `src/lib/supabaseClient.ts` is `server-only`
  and no Supabase key is exposed to the browser (none are `NEXT_PUBLIC_`). Row-level
  security is on: the anon key can read `categories`/`dishes` and nothing else.
- **Server Action bodies are capped at 6 MB** (`next.config.ts`) so 5 MB photo
  uploads fit. Next's default is 1 MB, which silently rejects most phone photos.
- **The Content-Security-Policy relaxes only in development**, where React's dev
  build needs `eval` and hot reload needs a websocket. Don't copy those into the
  production branch.
- Deleting a dish or category also deletes its photos from storage. If you add
  another path that drops a dish row, call `deleteUploadedPhoto` alongside it.
