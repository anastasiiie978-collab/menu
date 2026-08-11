import type { Metadata } from "next";
import Link from "next/link";
import { getMenu } from "@/lib/dishes";
import { CategoryNav } from "@/components/CategoryNav";
import { DishCard } from "@/components/DishCard";
import { BackToTop } from "@/components/BackToTop";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "To'liq menyu — Suhbat",
  description: "Suhbat restorani to'liq menyusi: birinchi taomlar, ikkinchi taomlar, shashliklar va salatlar.",
};

const INSTAGRAM_URL = "https://www.instagram.com/suhbat_milliytaomlar/";

export default async function MenuPage() {
  let menu;
  try {
    menu = await getMenu();
  } catch {
    menu = null;
  }

  if (!menu || menu.categories.length === 0) {
    return (
      <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-heading text-lg text-gold-light">Menyu vaqtincha ochilmayapti</p>
        <p className="mt-2 text-sm text-muted">Birozdan keyin qayta urinib ko&apos;ring.</p>
        <Link href="/" className="mt-6 text-sm text-gold underline underline-offset-4">
          Bosh sahifaga qaytish
        </Link>
      </main>
    );
  }

  const { categories, dishes } = menu;

  return (
    <main className="flex flex-1 flex-col pb-16">
      <header className="mx-auto w-full max-w-3xl px-6 pb-4 pt-8 text-center">
        <p className="font-heading text-xs tracking-[0.35em] text-muted">SUHBAT</p>
        <h1 className="mt-2 font-display text-3xl italic text-gold-light">To&apos;liq menyu</h1>
      </header>

      <CategoryNav categories={categories} />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 pt-8 sm:px-6">
        {categories.map((category) => {
          const categoryDishes = dishes.filter((d) => d.categoryId === category.id);
          if (categoryDishes.length === 0) return null;

          return (
            <section key={category.id} id={category.slug} className="scroll-mt-20">
              <h2 className="mb-6 font-heading text-2xl tracking-wide text-cream">
                {category.name}
              </h2>
              <div className="flex flex-col gap-10">
                {categoryDishes.map((dish, index) => (
                  <DishCard
                    key={dish.id}
                    dish={dish}
                    reversed={index % 2 === 1}
                    priority={category.sortOrder === 1 && index === 0}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mx-auto mt-16 flex w-full max-w-3xl flex-col items-center gap-4 px-6 text-center">
        <p className="font-display text-lg italic text-gold-light">Suhbat</p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center text-sm text-muted underline underline-offset-4"
        >
          @suhbat_milliytaomlar
        </a>
        <Link href="/" className="flex min-h-11 items-center text-sm text-muted-2">
          &larr; Bosh sahifaga qaytish
        </Link>
      </footer>

      <BackToTop />
    </main>
  );
}
