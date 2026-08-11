import Link from "next/link";
import { getCategories } from "@/lib/dishes";
import { DishForm } from "@/components/admin/DishForm";
import { createDishAction } from "@/app/admin/actions";

// Categories are admin-editable, so this page must never be prerendered at build
// time — otherwise a newly added category is missing from the Toifa dropdown.
export const dynamic = "force-dynamic";

export default async function NewDishPage() {
  const categories = await getCategories();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-10">
      <Link href="/admin/dashboard" className="mb-6 text-sm text-muted">
        &larr; Orqaga
      </Link>
      <h1 className="mb-6 font-heading text-xl text-gold-light">Yangi taom qo&apos;shish</h1>
      <DishForm categories={categories} action={createDishAction} submitLabel="Qo'shish" />
    </main>
  );
}
