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
  const layoutClass = `flex gap-4 sm:items-center sm:gap-6 ${
    reversed ? "flex-col-reverse sm:flex-row-reverse" : "flex-col sm:flex-row"
  }`;

  const content = (
    <>
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
    </>
  );

  if (priority) {
    return <div className={layoutClass}>{content}</div>;
  }

  return <RevealOnScroll className={layoutClass}>{content}</RevealOnScroll>;
}
