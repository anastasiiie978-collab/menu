// Groups thousands with a plain space ("38 000 so'm") without going through
// Intl/toLocaleString. Locale data differs between the Node server (full ICU —
// groups with a non-breaking space for uz-UZ) and some browsers (which may lack
// the uz-UZ locale and fall back to comma grouping). When the same value renders
// on both sides — as it does now that DishCard is a client component — that
// difference is a React hydration mismatch. A manual regex is identical
// everywhere, so it can't drift.
export function formatSom(price: number) {
  const grouped = Math.round(price)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} so'm`;
}
