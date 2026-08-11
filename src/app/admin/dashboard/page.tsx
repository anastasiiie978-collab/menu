import Image from "next/image";
import Link from "next/link";
import { getMenu } from "@/lib/dishes";
import { formatSom } from "@/lib/format";
import { logoutAction, toggleSoldOutAction } from "@/app/admin/actions";
import { DeleteDishButton } from "@/components/admin/DeleteDishButton";
import { AddCategoryForm } from "@/components/admin/AddCategoryForm";
import { DeleteCategoryButton } from "@/components/admin/DeleteCategoryButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { categories, dishes } = await getMenu();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6">
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

      <section className="mt-8 rounded-lg border border-panel-2 bg-surface p-4">
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
        className="mt-6 flex min-h-14 items-center justify-center rounded-lg bg-gold px-6 font-heading text-sm tracking-wide text-canvas"
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
                    className="flex items-center gap-3 rounded-lg border border-panel-2 bg-surface p-3"
                  >
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

                    <form action={toggleSoldOutAction.bind(null, dish.id, dish.soldOut)}>
                      <button
                        type="submit"
                        className="min-h-11 rounded-md border border-panel-2 px-3 text-xs text-muted"
                      >
                        {dish.soldOut ? "Qaytarish" : "Tugadi"}
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
