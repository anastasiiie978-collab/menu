import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth";
import { getCategories } from "@/lib/dishes";
import { DishForm } from "@/components/admin/DishForm";
import { createDishAction } from "@/app/admin/actions";

// Categories are admin-editable, so this page must never be prerendered at build
// time — otherwise a newly added category is missing from the Toifa dropdown.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function NewDishPage() {
  // See the dashboard page: proxy.ts is a convenience redirect, not the only
  // thing standing between this data and the internet.
  if (!(await verifyAdminSession())) redirect("/admin");

  const categories = await getCategories();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-10">
      <Link href="/admin/dashboard" className="mb-6 text-sm text-muted">
        &larr; Orqaga
      </Link>
      <h1 className="mb-6 font-heading text-xl text-gold-light">Yangi taom qo&apos;shish</h1>
      {categories.length === 0 ? (
        <div className="rounded-lg border border-panel-2 bg-surface p-4 text-sm text-muted">
          <p>Taom qo&apos;shishdan oldin kamida bitta toifa yarating.</p>
          <Link
            href="/admin/dashboard"
            className="mt-4 flex min-h-11 items-center justify-center rounded-md bg-gold px-4 font-heading text-xs tracking-wide text-on-gold"
          >
            Toifalar bo&apos;limiga qaytish
          </Link>
        </div>
      ) : (
        <DishForm categories={categories} action={createDishAction} submitLabel="Qo'shish" />
      )}
    </main>
  );
}
