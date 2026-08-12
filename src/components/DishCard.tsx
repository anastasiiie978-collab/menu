"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { formatSom } from "@/lib/format";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { DishDetail } from "@/components/DishDetail";
import type { Dish } from "@/lib/types";

export function DishCard({
  dish,
  categoryName,
  reversed,
  priority = false,
}: {
  dish: Dish;
  categoryName?: string;
  reversed: boolean;
  priority?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileLoaded, setMobileLoaded] = useState(false);
  const [desktopLoaded, setDesktopLoaded] = useState(false);
  // Returns focus to the card that opened the sheet once it closes, so
  // keyboard/screen-reader users land back where they were instead of at the
  // top of the page.
  const triggerRef = useRef<HTMLButtonElement>(null);

  const mobilePhoto = (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-panel-2">
      {dish.photoUrl ? (
        <>
          {!mobileLoaded && <div aria-hidden="true" className="shimmer pointer-events-none" />}
          <Image
            src={dish.photoUrl}
            alt=""
            fill
            preload={priority}
            sizes="80px"
            onLoad={() => setMobileLoaded(true)}
            onError={() => setMobileLoaded(true)}
            className={`object-cover ${dish.soldOut ? "opacity-40 grayscale" : ""}`}
          />
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-muted-2">
          <span className="font-display text-[10px] italic">Tez orada</span>
        </div>
      )}
      {dish.soldOut && (
        <span className="absolute left-1 top-1 rounded bg-canvas/90 px-1.5 py-0.5 font-heading text-[9px] tracking-wide text-gold-light">
          Tugadi
        </span>
      )}
    </div>
  );

  const desktopPhoto = (
    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-panel-2 sm:w-2/5">
      {dish.photoUrl ? (
        <>
          {!desktopLoaded && <div aria-hidden="true" className="shimmer pointer-events-none" />}
          <Image
            src={dish.photoUrl}
            alt=""
            fill
            // Not preloaded: this variant is hidden on mobile (~99% of traffic) via `hidden sm:flex`.
            // Preloading it there would fetch a second, larger image nobody sees. `fetchPriority`
            // only raises priority once the browser actually decides to fetch it (i.e. on desktop,
            // where it's visible and above the fold), without forcing an eager/blocking fetch on mobile.
            fetchPriority={priority ? "high" : undefined}
            sizes="(min-width: 640px) 40vw, 100vw"
            onLoad={() => setDesktopLoaded(true)}
            onError={() => setDesktopLoaded(true)}
            className={`object-cover ${dish.soldOut ? "opacity-40 grayscale" : ""}`}
          />
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-muted-2">
          <span className="font-display text-sm italic">Rasm tez orada</span>
        </div>
      )}
      {dish.soldOut && (
        <span className="absolute left-2 top-2 rounded-md bg-canvas/90 px-2 py-1 font-heading text-xs tracking-wide text-gold-light">
          Tugadi
        </span>
      )}
    </div>
  );

  const content = (
    // The overlay button below covers this card, so the photos use alt="" and the
    // button carries the accessible name — otherwise every dish is announced twice.
    <div className="relative">
      {/* Mobile: compact row so several dishes fit on one screen without scrolling */}
      <div className="flex gap-3 sm:hidden">
        {mobilePhoto}
        <div className={`min-w-0 flex-1 ${dish.soldOut ? "opacity-60" : ""}`}>
          <h3 className="truncate font-heading text-sm tracking-wide text-cream">{dish.name}</h3>
          {dish.description && (
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">{dish.description}</p>
          )}
          <p className="mt-1 font-display text-base italic text-gold-light">
            {formatSom(dish.price)}
            {dish.priceUnit && <span className="text-xs text-muted not-italic"> / {dish.priceUnit}</span>}
          </p>
        </div>
      </div>

      {/* Desktop: full alternating hero layout */}
      <div
        className={`hidden sm:flex sm:items-center sm:gap-6 ${
          reversed ? "sm:flex-row-reverse" : "sm:flex-row"
        }`}
      >
        {desktopPhoto}
        <div className={`flex-1 ${dish.soldOut ? "opacity-60" : ""}`}>
          <h3 className="font-heading text-lg tracking-wide text-cream">{dish.name}</h3>
          {dish.description && (
            <p className="mt-1 text-sm leading-relaxed text-muted">{dish.description}</p>
          )}
          <p className="mt-2 font-display text-xl italic text-gold-light">
            {formatSom(dish.price)}
            {dish.priceUnit && <span className="text-sm text-muted not-italic"> / {dish.priceUnit}</span>}
          </p>
        </div>
      </div>

      {/* Stretched overlay rather than wrapping the card in a <button>: a heading
          is not valid inside button content, and this keeps one clean tap target. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setDetailOpen(true)}
        aria-label={`${dish.name} — batafsil ko'rish`}
        className="absolute inset-0 -m-1 rounded-xl"
      />
    </div>
  );

  return (
    <>
      {priority ? content : <RevealOnScroll>{content}</RevealOnScroll>}
      {detailOpen && (
        <DishDetail
          dish={dish}
          categoryName={categoryName}
          onClose={() => {
            setDetailOpen(false);
            // Defer the focus to the next frame: closing unmounts DishDetail, and
            // its cleanup (which removes the `inert` it put on the background,
            // including this card) only runs during that unmount. Focusing
            // synchronously here would target a still-inert element and be a
            // silent no-op, dropping focus to <body>. By rAF time the unmount and
            // its cleanup have run, so the card can actually take focus.
            requestAnimationFrame(() => triggerRef.current?.focus());
          }}
        />
      )}
    </>
  );
}
