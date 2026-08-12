"use client";

import { useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/types";

const TRIGGER_LINE = 120;

export function CategoryNav({ categories }: { categories: Category[] }) {
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug);
  const pillRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const sections = categories
      .map((c) => ({ slug: c.slug, el: document.getElementById(c.slug) }))
      .filter((s): s is { slug: string; el: HTMLElement } => s.el !== null);

    let ticking = false;

    const updateActive = () => {
      ticking = false;
      let current = sections[0]?.slug;
      for (const section of sections) {
        if (section.el.getBoundingClientRect().top <= TRIGGER_LINE) {
          current = section.slug;
        }
      }
      if (current) setActiveSlug(current);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateActive);
    };

    updateActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [categories]);

  useEffect(() => {
    const pill = activeSlug ? pillRefs.current[activeSlug] : null;
    pill?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeSlug]);

  return (
    <div className="sticky top-0 z-10 bg-canvas/95 backdrop-blur-sm">
      <nav
        aria-label="Toifalar"
        className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3 sm:px-6"
      >
        {categories.map((category) => {
          const isActive = category.slug === activeSlug;
          return (
            <a
              key={category.id}
              ref={(el) => {
                pillRefs.current[category.slug] = el;
              }}
              href={`#${category.slug}`}
              aria-current={isActive ? "true" : undefined}
              className={`flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full border px-4 font-heading text-xs tracking-wide transition-colors ${
                isActive
                  ? "border-gold text-gold-light"
                  : "border-panel-2 text-muted active:border-gold active:text-gold-light"
              }`}
            >
              {category.name}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
