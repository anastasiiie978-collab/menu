// The five backgrounds the manager can switch between, and the full token set each
// one implies. Every color the UI uses lives here rather than being split between
// this file and globals.css — a theme is only "a background color" from the
// manager's point of view, but a background is useless without text, border and
// accent colors that stay readable on it, and keeping them together is what makes
// that checkable. `npm run check:contrast` verifies every pair below against
// WCAG 2.2 AA and fails the build script if a future tweak breaks one.
//
// globals.css still carries the charcoal values inside Tailwind's `@theme` block:
// that is what makes `bg-canvas`, `text-muted` and friends exist as utilities at
// build time. At request time the root layout overrides those same custom
// properties for whichever theme is active, so nothing here has to be mirrored
// into a stylesheet by hand.

export type ThemeId = "kumir" | "tandir" | "samarqand" | "anor" | "qogoz";

export type ThemeColors = {
  /** Page background. */
  canvas: string;
  /** Cards, inputs, raised rows. */
  surface: string;
  /** Pressed/active fills. */
  panel: string;
  /** Borders and photo frames. Decorative — see check-contrast.mjs. */
  panel2: string;
  /** Border of an actual form field, where WCAG 1.4.11's 3:1 applies. */
  fieldBorder: string;
  /** Brand accent — button fills, links, focus borders. */
  gold: string;
  /** Stronger accent — headings, prices, badges. */
  goldLight: string;
  /** Primary text. */
  cream: string;
  /** Secondary text. */
  muted: string;
  /** Tertiary text — labels, captions. */
  muted2: string;
  /** Text sitting on a `gold` fill. In a light theme this is NOT `canvas`. */
  onGold: string;
  /** Text sitting on a `panel2` fill — the "Rasm tez orada" placeholder tiles. */
  onPanel: string;
  /** Destructive text and error banners. */
  danger: string;
  /** Quieter destructive text (the banner's dismiss link). */
  dangerSoft: string;
  /** Photo loading sweep, as an "R G B" triple so it can carry an alpha. */
  shimmerRgb: string;
};

export type Theme = {
  id: ThemeId;
  /** Shown on the picker card. */
  name: string;
  /** One line of "when would I pick this", in the admin panel's language. */
  hint: string;
  /** Drives the browser/OS chrome color and the light-theme UI affordances. */
  isLight: boolean;
  colors: ThemeColors;
};

export const THEMES: readonly Theme[] = [
  {
    id: "kumir",
    name: "Ko'mir",
    hint: "Asl ko'rinish — cho'g' rangidagi qora fon, taom rasmlari eng yorqin chiqadi.",
    isLight: false,
    colors: {
      canvas: "#121212",
      surface: "#1a1a1a",
      panel: "#2c2c2c",
      panel2: "#3a3a3a",
      fieldBorder: "#6a6760",
      gold: "#c8a24a",
      goldLight: "#e0c485",
      cream: "#f2ede4",
      muted: "#9a938a",
      muted2: "#8a847a",
      onGold: "#121212",
      onPanel: "#c8c2b8",
      danger: "#f28b82",
      dangerSoft: "#e9a49d",
      shimmerRgb: "242 237 228",
    },
  },
  {
    id: "tandir",
    name: "Tandir",
    hint: "Iliq qahva-jigarrang — non va qozon taomlariga yaqin, kechqurun yumshoq ko'rinadi.",
    isLight: false,
    colors: {
      canvas: "#17110d",
      surface: "#211913",
      panel: "#33261b",
      panel2: "#453527",
      fieldBorder: "#776a5b",
      gold: "#cfa851",
      goldLight: "#e8cd92",
      cream: "#f5ece0",
      muted: "#ab9b8b",
      muted2: "#8f8172",
      onGold: "#17110d",
      onPanel: "#cabbaa",
      danger: "#f4907f",
      dangerSoft: "#eaa79a",
      shimmerRgb: "245 236 224",
    },
  },
  {
    id: "samarqand",
    name: "Samarqand",
    hint: "Koshin ko'ki — sovuq fon issiq taom ranglarini yanada ochib beradi.",
    isLight: false,
    colors: {
      canvas: "#0d1421",
      surface: "#141d2c",
      panel: "#212d43",
      panel2: "#2e3b55",
      fieldBorder: "#5c687f",
      gold: "#cba757",
      goldLight: "#e3c98f",
      cream: "#edf1f8",
      muted: "#9ba7bc",
      muted2: "#8390a6",
      onGold: "#0d1421",
      onPanel: "#bcc6d8",
      danger: "#f4918e",
      dangerSoft: "#e9a8a5",
      shimmerRgb: "237 241 248",
    },
  },
  {
    id: "anor",
    name: "Anor",
    hint: "To'q anor rangi — bayram va kechki ziyofat kayfiyati, oltin bezak kuchli chiqadi.",
    isLight: false,
    colors: {
      canvas: "#1a0e12",
      surface: "#24151a",
      panel: "#3b2028",
      panel2: "#4e2c36",
      fieldBorder: "#80606a",
      gold: "#d0a659",
      goldLight: "#e8ca92",
      cream: "#f7ece9",
      muted: "#b8a0a1",
      muted2: "#9c8485",
      onGold: "#1a0e12",
      onPanel: "#d3bcbe",
      danger: "#f79b8d",
      dangerSoft: "#eeb0a4",
      shimmerRgb: "247 236 233",
    },
  },
  {
    id: "qogoz",
    name: "Qog'oz",
    hint: "Yorug' qog'oz — kunduzi ayvonda, quyoshda o'qish uchun eng qulay.",
    isLight: true,
    colors: {
      canvas: "#f7f2e8",
      surface: "#fffdf7",
      panel: "#e9e0cd",
      panel2: "#9a8b70",
      fieldBorder: "#8a7c62",
      // Antique bronze rather than the brand gold: #c8a24a only reaches 2.1:1 on
      // ivory, so as link/label text it would be unreadable in the daylight this
      // theme exists for. Same hue family, taken down until it passes AA.
      gold: "#856520",
      // Deliberately *darker* than `gold` here — "light" names the role (the
      // stronger accent: headings, prices), not the lightness, and on a pale
      // background the stronger accent has to be the deeper one.
      goldLight: "#6f5514",
      cream: "#221c14",
      muted: "#5f5648",
      muted2: "#6f6456",
      onGold: "#fbf7ee",
      onPanel: "#1f1a12",
      danger: "#a32020",
      dangerSoft: "#8a2222",
      shimmerRgb: "34 28 20",
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = "kumir";

const THEMES_BY_ID = new Map(THEMES.map((theme) => [theme.id, theme]));

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEMES_BY_ID.has(value as ThemeId);
}

export function getTheme(id: string | null | undefined): Theme {
  return (id && THEMES_BY_ID.get(id as ThemeId)) || THEMES_BY_ID.get(DEFAULT_THEME_ID)!;
}

/**
 * The custom-property block for one theme.
 *
 * Scoped to `:root[data-theme="…"]` rather than plain `:root` on purpose: that
 * selector outranks the `:root` block Tailwind emits for `@theme`, so the
 * override wins no matter which of the two the browser sees first — and a
 * stylesheet/inline-style ordering change in a future Next release can't quietly
 * revert the site to charcoal.
 */
function themeCss(theme: Theme): string {
  const c = theme.colors;
  return `:root[data-theme="${theme.id}"]{--color-canvas:${c.canvas};--color-surface:${c.surface};--color-panel:${c.panel};--color-panel-2:${c.panel2};--color-field-border:${c.fieldBorder};--color-gold:${c.gold};--color-gold-light:${c.goldLight};--color-cream:${c.cream};--color-muted:${c.muted};--color-muted-2:${c.muted2};--color-on-gold:${c.onGold};--color-on-panel:${c.onPanel};--color-danger:${c.danger};--color-danger-soft:${c.dangerSoft};--shimmer-rgb:${c.shimmerRgb};color-scheme:${theme.isLight ? "light" : "dark"};}`;
}

/**
 * Every theme's variables, in one block that never changes.
 *
 * Emitting only the *active* theme looks leaner and is wrong. React 19 hoists a
 * `<style href precedence>` as a cached resource keyed by `href`: once that href
 * is in the document, a later render with the same href is a no-op even when the
 * CSS differs. So switching themes updated `data-theme` on <html> — React does
 * update attributes — while the stylesheet stayed on the old palette, and the
 * manager tapped a swatch and watched nothing happen until a hard reload.
 *
 * With all five present the stylesheet is constant, which makes the dedupe
 * correct rather than a trap, and leaves `data-theme` as the only moving part.
 * The whole block is about 2KB before compression, once per page.
 */
export function allThemesCss(): string {
  return THEMES.map(themeCss).join("");
}
