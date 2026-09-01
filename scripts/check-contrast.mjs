// Verifies every theme in src/lib/themes.ts against WCAG 2.2 AA.
//
// The five backgrounds are admin-switchable, which means a palette nobody
// reviewed can be live in the dining room at any moment. Each pair below is a
// place the UI actually puts one token on top of another, so a failure here is a
// real "the manager can pick a theme where the prices are unreadable" bug rather
// than a theoretical one. Run with: npm run check:contrast
//
// Thresholds: 4.5:1 for body text (1.4.3), 3:1 for large text and for borders
// that are the only outline of an input (1.4.11).
import { THEMES } from "../src/lib/themes.ts";

const srgbToLinear = (channel) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

function luminance(hex) {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => srgbToLinear(parseInt(value.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum, what this pair is on screen]
const PAIRS = [
  ["cream", "canvas", 4.5, "dish names, body copy"],
  ["cream", "surface", 4.5, "text on cards and inputs"],
  ["muted", "canvas", 4.5, "dish descriptions"],
  ["muted", "surface", 4.5, "form labels on cards"],
  ["muted2", "canvas", 4.5, "captions, tracking labels"],
  ["muted2", "surface", 4.5, "detail-sheet row labels"],
  ["goldLight", "canvas", 4.5, "prices, section headings"],
  ["goldLight", "surface", 4.5, "prices inside the detail sheet"],
  ["gold", "canvas", 4.5, "links, Instagram icon"],
  ["onGold", "gold", 4.5, "text on every primary button"],
  ["onPanel", "panel2", 4.5, "“Rasm tez orada” placeholder tiles"],
  ["danger", "canvas", 4.5, "inline form errors"],
  ["danger", "surface", 4.5, "errors on cards"],
  ["dangerSoft", "canvas", 4.5, "the error banner’s dismiss link"],
  ["cream", "panel", 4.5, "text on pressed/active fills"],
  // `panel2` outlines cards and fills photo frames — decoration around content
  // that is identifiable without it, which 1.4.11 exempts. The 3:1 rule lands on
  // `fieldBorder` instead: a text input has no label-shaped affordance of its own,
  // so its outline is the only thing marking where you are meant to type.
  ["fieldBorder", "canvas", 3.0, "text input / select / textarea outlines (1.4.11)"],
  ["fieldBorder", "surface", 3.0, "field outline against the field's own fill"],
  ["panel2", "canvas", 1.4, "decorative card outlines — visible, not load-bearing"],
  ["gold", "canvas", 3.0, "focus ring on the page background"],
  ["gold", "surface", 3.0, "focus ring on inputs"],
];

let failures = 0;
for (const theme of THEMES) {
  const rows = PAIRS.map(([fg, bg, min, what]) => {
    const ratio = contrast(theme.colors[fg], theme.colors[bg]);
    const ok = ratio >= min;
    if (!ok) failures += 1;
    return { ok, line: `  ${ok ? "PASS" : "FAIL"}  ${ratio.toFixed(2).padStart(5)}:1 (min ${min})  ${fg} on ${bg} — ${what}` };
  });
  console.log(`\n${theme.name} (${theme.id})${theme.isLight ? " [light]" : ""}`);
  for (const row of rows) console.log(row.line);
}

console.log(
  failures === 0
    ? `\nAll ${THEMES.length * PAIRS.length} contrast checks passed.`
    : `\n${failures} contrast check(s) FAILED.`
);
process.exit(failures === 0 ? 0 : 1);
