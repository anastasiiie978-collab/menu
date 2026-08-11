import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getDishById } from "@/lib/dishes";
import { DishForm } from "@/components/admin/DishForm";
import { updateDishAction } from "@/app/admin/actions";

// Same reason as the "new dish" page: the Toifa dropdown must reflect categories
// added since the last build.
export const dynamic = "force-dynamic";

export default async function EditDishPage(props: PageProps<"/admin/dashboard/[id]/edit">) {
  const { id } = await props.params;
  const [categories, dish] = await Promise.all([getCategories(), getDishById(id)]);
  if (!dish) notFound();

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
