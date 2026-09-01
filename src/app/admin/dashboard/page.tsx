import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth";
import { getMenu } from "@/lib/dishes";
import { getActiveThemeId } from "@/lib/siteSettings";
import { actionErrorMessage } from "@/lib/actionErrors";
import { formatSom } from "@/lib/format";
import { logoutAction, toggleSoldOutAction } from "@/app/admin/actions";
import { DeleteDishButton } from "@/components/admin/DeleteDishButton";
import { AddCategoryForm } from "@/components/admin/AddCategoryForm";
import { DeleteCategoryButton } from "@/components/admin/DeleteCategoryButton";
import { ThemePicker } from "@/components/admin/ThemePicker";

export const dynamic = "force-dynamic";

// The admin panel is linked from the public landing page, so a crawler can walk
// straight into it. Nothing sensitive renders without a session, but there is no
// reason for "Suhbat admin panel" to be a search result the staff have to explain.
export const metadata: Metadata = {
  title: "Admin panel — Suhbat",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage(props: PageProps<"/admin/dashboard">) {
  // Checked here as well as in proxy.ts. Next's own guidance is that proxy runs
  // "before routes are rendered" and is not the place to hold authorization on its
  // own — it can be deployed to a CDN, its matcher is one edit away from missing a
  // path, and framework-level bypasses of exactly this pattern have shipped before
  // (CVE-2025-29927). This page reads from the database, so the check belongs next
  // to the read. The mutations already do this.
  if (!(await verifyAdminSession())) redirect("/admin");

  const [{ categories, dishes }, activeThemeId, { error }] = await Promise.all([
    getMenu(),
    getActiveThemeId(),
    props.searchParams,
  ]);
  const errorMessage = actionErrorMessage(error);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="-ml-2 mb-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-md px-2 text-sm text-muted"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Bosh sahifa
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading text-xs tracking-[0.35em] text-muted">SUHBAT</p>
          <h1 className="mt-1 font-display text-2xl italic text-gold-light">Admin panel</h1>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="min-h-11 rounded-md border border-panel-2 px-4 text-sm text-muted"
          >
            Chiqish
          </button>
        </form>
      </div>

      {errorMessage && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          <p>{errorMessage}</p>
          {/* Plain link back to the clean URL — the error lives in ?error= from the
              redirect after a failed action, so without this it keeps showing on
              every reload/re-visit until the manager happens to navigate away. */}
          <Link
            href="/admin/dashboard"
            className="flex min-h-11 shrink-0 items-center px-1 text-xs text-danger-soft underline underline-offset-4"
          >
            Yopish
          </Link>
        </div>
      )}

      <ThemePicker activeThemeId={activeThemeId} />

      <section className="mt-6 rounded-lg border border-panel-2 bg-surface p-4">
        <h2 className="mb-3 font-heading text-sm tracking-wide text-cream">Toifalar</h2>
        <div className="flex flex-col gap-2">
          {categories.map((category) => {
            const dishCount = dishes.filter((d) => d.categoryId === category.id).length;
            return (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-md border border-panel-2 px-3 py-2"
              >
                <p className="min-w-0 flex-1 truncate text-sm text-cream">
                  {category.name} <span className="text-xs text-muted">({dishCount})</span>
                </p>
                <DeleteCategoryButton
                  categoryId={category.id}
                  categoryName={category.name}
                  dishCount={dishCount}
                />
              </div>
            );
          })}
          {categories.length === 0 && <p className="text-sm text-muted-2">Hali toifa yo&apos;q.</p>}
        </div>
        <div className="mt-3">
          <AddCategoryForm />
        </div>
      </section>

      <Link
        href="/admin/dashboard/new"
        className="mt-6 flex min-h-14 items-center justify-center rounded-lg bg-gold px-6 font-heading text-sm tracking-wide text-on-gold"
      >
        + Yangi taom qo&apos;shish
      </Link>

      <div className="mt-10 flex flex-col gap-10">
        {categories.map((category) => {
          const categoryDishes = dishes.filter((d) => d.categoryId === category.id);
          return (
            <section key={category.id}>
              <h2 className="mb-4 font-heading text-lg tracking-wide text-cream">
                {category.name}{" "}
                <span className="text-sm font-normal text-muted">({categoryDishes.length})</span>
              </h2>

              <div className="flex flex-col gap-3">
                {categoryDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex flex-col gap-3 rounded-lg border border-panel-2 bg-surface p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3 sm:flex-1">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-panel-2">
                        {dish.photoUrl && (
                          <Image
                            src={dish.photoUrl}
                            alt={dish.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-sm text-cream">{dish.name}</p>
                        <p className="text-xs text-muted">
                          {formatSom(dish.price)}
                          {dish.priceUnit && ` / ${dish.priceUnit}`}
                          {dish.soldOut && <span className="ml-2 text-gold-light">Tugadi</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <form action={toggleSoldOutAction.bind(null, dish.id)}>
                        <button
                          type="submit"
                          className="min-h-11 rounded-md border border-panel-2 px-3 text-xs text-muted"
                        >
                          {dish.soldOut ? "Mavjud" : "Tugadi"}
                        </button>
                      </form>

                      <Link
                        href={`/admin/dashboard/${dish.id}/edit`}
                        className="flex min-h-11 items-center rounded-md border border-panel-2 px-3 text-xs text-cream"
                      >
                        Tahrirlash
                      </Link>

                      <DeleteDishButton dishId={dish.id} dishName={dish.name} />
                    </div>
                  </div>
                ))}

                {categoryDishes.length === 0 && (
                  <p className="text-sm text-muted-2">Bu toifada taom yo&apos;q.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
