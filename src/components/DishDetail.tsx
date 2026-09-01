"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatSom } from "@/lib/format";
import type { Dish } from "@/lib/types";

export function DishDetail({
  dish,
  categoryName,
  onClose,
}: {
  dish: Dish;
  categoryName?: string;
  onClose: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // See DishCard: a photo that fails to load falls back to the themed placeholder
  // rather than leaving a broken-image glyph in the middle of the sheet.
  const [photoStatus, setPhotoStatus] = useState<"loading" | "loaded" | "failed">("loading");

  // The sheet is rendered inline in the tree (not a portal), so the menu list
  // behind it shares ancestors with it. A sighted user can't reach that list —
  // it's fully covered — but a screen reader's swipe navigation isn't blocked
  // by CSS coverage alone, so without this it can still land on category
  // links or other dishes behind the sheet. Walk up from the dialog root to
  // <body>, marking every sibling along the way inert; this never touches the
  // dialog's own subtree, only what's genuinely outside it. Purely
  // non-visual, so it has no effect on the ~99% of visitors who aren't using
  // assistive tech.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const restore: Array<() => void> = [];
    let node: HTMLElement = root;

    while (node !== document.body) {
      const parent: HTMLElement | null = node.parentElement;
      if (!parent) break;
      for (const sibling of Array.from(parent.children)) {
        if (sibling === node || !(sibling instanceof HTMLElement) || sibling.inert) continue;
        sibling.inert = true;
        restore.push(() => {
          sibling.inert = false;
        });
      }
      node = parent;
    }

    return () => {
      for (const undo of restore) undo();
    };
  }, []);

  // Kept in a ref so the effect below can depend on nothing at all. DishCard passes
  // `onClose` as an inline arrow, so it is a new function on every one of its
  // renders — and it re-renders whenever a dish photo finishes loading. With
  // `[onClose]` as the dependency list, a photo that landed *after* the sheet was
  // opened re-ran the effect and pushed a second history entry: the first back
  // press then closed the sheet as intended, and the second did nothing visible
  // because both entries share the menu's URL. Easy to miss on a fast connection
  // and easy to hit on the slow mobile ones this menu is mostly read over.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Every close path routes through history.back(), and popstate is the single
  // place that actually tears the sheet down. That keeps the Android hardware
  // back button (the way most people will dismiss this) and the X button on
  // exactly the same code path, so the history stack can't drift out of sync.
  useEffect(() => {
    window.history.pushState({ suhbatDishSheet: true }, "");
    const onPopState = () => onCloseRef.current();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const requestClose = () => window.history.back();

  // Freeze the menu behind the sheet, otherwise scrolling the sheet drags the
  // list underneath and the customer loses their place in a 39-dish menu.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
        return;
      }
      if (event.key !== "Tab") return;

      // Keep focus inside the dialog while it's open.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const detailRows: { label: string; value: string }[] = [
    { label: "Narxi", value: formatSom(dish.price) },
    ...(dish.priceUnit ? [{ label: "O'lchov", value: dish.priceUnit }] : []),
    { label: "Holati", value: dish.soldOut ? "Hozircha tugadi" : "Mavjud" },
  ];

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={dish.name}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-canvas sm:flex sm:items-center sm:justify-center sm:bg-canvas/80 sm:p-8 sm:backdrop-blur-sm"
    >
      {/* Desktop only: clicking the dimmed area behind the card closes it. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={requestClose}
        className="hidden sm:absolute sm:inset-0 sm:block sm:cursor-default"
      />

      <div
        ref={panelRef}
        className="animate-sheet-in relative mx-auto w-full sm:max-w-lg sm:overflow-hidden sm:rounded-2xl sm:border sm:border-panel-2 sm:bg-canvas sm:shadow-2xl"
      >
        <div className="relative">
          <div className="relative aspect-[4/3] w-full bg-panel-2">
            {dish.photoUrl && photoStatus !== "failed" ? (
              <>
                {photoStatus === "loading" && (
                  <div aria-hidden="true" className="shimmer pointer-events-none" />
                )}
                <Image
                  src={dish.photoUrl}
                  alt={dish.name}
                  fill
                  sizes="(min-width: 640px) 512px, 100vw"
                  onLoad={() => setPhotoStatus("loaded")}
                  onError={() => setPhotoStatus("failed")}
                  className={`object-cover ${dish.soldOut ? "opacity-45 grayscale" : ""}`}
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-on-panel">
                <span className="font-display text-lg italic">Rasm tez orada</span>
              </div>
            )}
            {/* Softens the photo into the page rather than cutting it with a hard edge. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-canvas" />
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={requestClose}
            aria-label="Yopish"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-panel-2 bg-canvas/80 text-cream backdrop-blur-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          {dish.soldOut && (
            <span className="absolute left-4 top-4 rounded-md border border-gold/40 bg-canvas/90 px-3 py-1.5 font-heading text-xs tracking-wide text-gold-light backdrop-blur-sm">
              Hozircha tugadi
            </span>
          )}
        </div>

        <div className="px-6 pb-10 pt-2 sm:px-8">
          {categoryName && (
            <p className="font-heading text-[11px] tracking-[0.3em] text-muted-2">
              {categoryName.toUpperCase()}
            </p>
          )}

          <h2 className="mt-2 font-heading text-3xl leading-tight tracking-wide text-cream">
            {dish.name}
          </h2>

          <div className="mt-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px w-10 bg-gold/60" />
            <span className="h-1.5 w-1.5 rotate-45 bg-gold/80" />
            <span className="h-px flex-1 bg-gold/20" />
          </div>

          {dish.description && (
            <p className="mt-5 font-body text-[15px] leading-relaxed text-muted">
              {dish.description}
            </p>
          )}

          <dl className="mt-7 overflow-hidden rounded-xl border border-panel-2 bg-surface">
            {detailRows.map((row, index) => (
              <div
                key={row.label}
                className={`flex items-baseline justify-between gap-4 px-5 py-4 ${
                  index > 0 ? "border-t border-panel-2" : ""
                }`}
              >
                <dt className="font-heading text-[11px] tracking-[0.2em] text-muted-2">
                  {row.label.toUpperCase()}
                </dt>
                <dd
                  className={
                    row.label === "Narxi"
                      ? "font-display text-2xl italic text-gold-light"
                      : "font-body text-sm text-cream"
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <button
            type="button"
            onClick={requestClose}
            className="mt-7 flex min-h-14 w-full items-center justify-center rounded-lg border border-panel-2 bg-surface px-6 font-heading text-sm tracking-[0.15em] text-muted"
          >
            YOPISH
          </button>
        </div>
      </div>
    </div>
  );
}
