import Image from "next/image";
import { formatSom } from "@/lib/format";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import type { Dish } from "@/lib/types";

export function DishCard({
  dish,
  reversed,
  priority = false,
}: {
  dish: Dish;
  reversed: boolean;
  priority?: boolean;
}) {
  const mobilePhoto = (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-panel-2">
      {dish.photoUrl ? (
        <Image
          src={dish.photoUrl}
          alt={dish.name}
          fill
          priority={priority}
          sizes="80px"
          className={`object-cover ${dish.soldOut ? "opacity-40 grayscale" : ""}`}
        />
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
        <Image
          src={dish.photoUrl}
          alt={dish.name}
          fill
          priority={priority}
          sizes="(min-width: 640px) 40vw, 100vw"
          className={`object-cover ${dish.soldOut ? "opacity-40 grayscale" : ""}`}
        />
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
    <>
      {/* Mobile: compact row so several dishes fit on one screen without scrolling */}
      <div className={`flex gap-3 sm:hidden ${dish.soldOut ? "opacity-60" : ""}`}>
        {mobilePhoto}
        <div className="min-w-0 flex-1">
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

      {/* Desktop: full alternating hero layout, unchanged */}
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
    </>
  );

  if (priority) {
    return <div>{content}</div>;
  }

  return <RevealOnScroll>{content}</RevealOnScroll>;
}
