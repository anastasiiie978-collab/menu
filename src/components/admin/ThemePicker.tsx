"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setThemeAction } from "@/app/admin/actions";
import { THEMES, getTheme, type Theme, type ThemeId } from "@/lib/themes";

// One <form> holding five submit buttons rather than five separate forms: a submit
// button contributes its own name/value to the FormData, so `themeId` arrives
// carrying whichever swatch was tapped. That keeps it to one action, one error
// slot, and — because `useFormStatus` reports the FormData mid-flight — lets each
// tile know whether *it* is the one being saved.

function ThemeTile({ theme, isActive }: { theme: Theme; isActive: boolean }) {
  const { pending, data } = useFormStatus();
  const isSaving = pending && data?.get("themeId") === theme.id;
  const c = theme.colors;

  return (
    <button
      type="submit"
      name="themeId"
      value={theme.id}
      disabled={pending}
      aria-current={isActive ? "true" : undefined}
      // The tile paints itself in its own palette, so the manager is choosing from
      // five things that look like what they will get rather than from five words.
      // Colors come from inline styles for exactly that reason: Tailwind utilities
      // would render every tile in the theme that is currently active.
      className={`relative flex min-h-14 flex-col gap-2 rounded-lg border-2 p-2 text-left transition-opacity disabled:opacity-60 ${
        isActive ? "border-gold" : "border-panel-2"
      }`}
      style={{ backgroundColor: c.canvas }}
    >
      {/* A miniature menu card: heading rule, dish name, description. */}
      <span aria-hidden="true" className="flex flex-col gap-1 rounded-md p-2" style={{ backgroundColor: c.surface }}>
        <span className="h-1.5 w-10 rounded-full" style={{ backgroundColor: c.goldLight }} />
        <span className="h-1 w-full rounded-full" style={{ backgroundColor: c.cream, opacity: 0.85 }} />
        <span className="h-1 w-2/3 rounded-full" style={{ backgroundColor: c.muted }} />
      </span>

      {/* The tick floats over the preview rather than sharing a row with the name:
          three columns on a 360px phone leaves roughly 76px of text width, and
          "Samarqand" plus a tick does not fit in it. Overlaying keeps every name
          fully readable at the narrowest size the menu is actually used at. */}
      {(isActive || isSaving) && (
        <span
          className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: c.canvas }}
        >
          {isSaving ? (
            <span className="font-body text-[10px] leading-none" style={{ color: c.muted }}>
              ...
            </span>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={c.goldLight}
              strokeWidth="3"
              aria-hidden="true"
              className="h-3 w-3"
            >
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      )}

      <span className="block truncate px-0.5 font-heading text-xs tracking-wide" style={{ color: c.cream }}>
        {theme.name}
      </span>
    </button>
  );
}

export function ThemePicker({ activeThemeId }: { activeThemeId: ThemeId }) {
  const [state, formAction] = useActionState(setThemeAction, undefined);
  const active = getTheme(activeThemeId);

  return (
    <section className="mt-8 rounded-lg border border-panel-2 bg-surface p-4">
      <h2 className="font-heading text-sm tracking-wide text-cream">Menyu foni</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Tanlangan rang butun saytga — mijozlar ko&apos;radigan menyuga ham — darhol
        qo&apos;llaniladi.
      </p>

      <form action={formAction} className="mt-3">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {THEMES.map((theme) => (
            <ThemeTile key={theme.id} theme={theme} isActive={theme.id === activeThemeId} />
          ))}
        </div>
      </form>

      {/* Only the selected theme explains itself — five hints at once is a wall of
          text on a phone, and the tile previews already carry the comparison. */}
      <p className="mt-3 text-xs leading-relaxed text-muted-2">
        <span className="text-muted">{active.name}:</span> {active.hint}
      </p>

      {state?.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
    </section>
  );
}
