import Link from "next/link";
import { getCategories, getDishById } from "@/lib/dishes";
import { DishForm } from "@/components/admin/DishForm";
import { updateDishAction } from "@/app/admin/actions";

// Same reason as the "new dish" page: the Toifa dropdown must reflect categories
// added since the last build.
export const dynamic = "force-dynamic";

export default async function EditDishPage(props: PageProps<"/admin/dashboard/[id]/edit">) {
  const { id } = await props.params;
  const [categories, dish] = await Promise.all([getCategories(), getDishById(id)]);

  // A dish edited on this device can have been deleted from another device (or
  // tab) moments earlier. Next's default not-found page is a generic English
  // 404 with no way back into the admin panel — confusing for a non-technical
  // manager on a phone — so show the same friendly, in-context message the
  // rest of the admin panel uses for this exact scenario instead.
  if (!dish) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-10">
        <Link href="/admin/dashboard" className="mb-6 text-sm text-muted">
          &larr; Orqaga
        </Link>
        <div className="rounded-lg border border-panel-2 bg-surface p-4 text-sm text-muted">
          <p>Bu taom topilmadi — ehtimol uni boshqa qurilmada allaqachon o&apos;chirib yuborishgan.</p>
          <Link
            href="/admin/dashboard"
            className="mt-4 flex min-h-11 items-center justify-center rounded-md bg-gold px-4 font-heading text-xs tracking-wide text-canvas"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      </main>
    );
  }

  const action = updateDishAction.bind(null, dish.id);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-10">
      <Link href="/admin/dashboard" className="mb-6 text-sm text-muted">
        &larr; Orqaga
      </Link>
      <h1 className="mb-6 font-heading text-xl text-gold-light">{dish.name}ni tahrirlash</h1>
      <DishForm categories={categories} dish={dish} action={action} submitLabel="Saqlash" />
    </main>
  );
}
