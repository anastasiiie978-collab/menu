"use client";

import { useActionState } from "react";
import Image from "next/image";
import type { Category, Dish } from "@/lib/types";
import type { FormState } from "@/app/admin/actions";

type DishFormAction = (state: FormState, formData: FormData) => Promise<FormState>;

export function DishForm({
  categories,
  dish,
  action,
  submitLabel,
}: {
  categories: Category[];
  dish?: Dish;
  action: DishFormAction;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="font-heading text-xs tracking-wide text-muted">Nomi</span>
        <input
          name="name"
          defaultValue={dish?.name}
          required
          maxLength={100}
          className="min-h-14 rounded-lg border border-field-border bg-surface px-4 text-base text-cream outline-none focus:border-gold"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-heading text-xs tracking-wide text-muted">Tavsif (ixtiyoriy)</span>
        <textarea
          name="description"
          defaultValue={dish?.description}
          rows={2}
          maxLength={500}
          className="rounded-lg border border-field-border bg-surface px-4 py-3 text-base text-cream outline-none focus:border-gold"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-heading text-xs tracking-wide text-muted">Toifa</span>
        <select
          name="categoryId"
          defaultValue={dish?.categoryId ?? categories[0]?.id}
          required
          className="min-h-14 rounded-lg border border-field-border bg-surface px-4 text-base text-cream outline-none focus:border-gold"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-4">
        <label className="flex flex-1 flex-col gap-2">
          <span className="font-heading text-xs tracking-wide text-muted">Narxi (so&apos;m)</span>
          <input
            type="number"
            name="price"
            min={1}
            max={50000000}
            step={1}
            defaultValue={dish?.price}
            required
            className="min-h-14 rounded-lg border border-field-border bg-surface px-4 text-base text-cream outline-none focus:border-gold"
          />
        </label>
        <label className="flex flex-1 flex-col gap-2">
          <span className="font-heading text-xs tracking-wide text-muted">O&apos;lchov (ixtiyoriy)</span>
          <input
            name="priceUnit"
            placeholder="masalan: 1 sixga"
            defaultValue={dish?.priceUnit ?? ""}
            className="min-h-14 rounded-lg border border-field-border bg-surface px-4 text-base text-cream outline-none focus:border-gold"
          />
        </label>
      </div>

      <label className="flex flex-col gap-2">
        <span className="font-heading text-xs tracking-wide text-muted">Rasm (ixtiyoriy)</span>
        {dish?.photoUrl && (
          <div className="relative h-32 w-full overflow-hidden rounded-lg bg-panel-2 sm:w-48">
            <Image
              src={dish.photoUrl}
              alt={dish.name}
              fill
              sizes="(min-width: 640px) 192px, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm text-muted file:mr-4 file:rounded-md file:border-0 file:bg-panel-2 file:px-4 file:py-3 file:font-heading file:text-xs file:text-cream"
        />
      </label>

      {state?.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="min-h-14 rounded-lg bg-gold px-6 font-heading text-base tracking-wide text-on-gold transition-opacity disabled:opacity-60"
      >
        {pending ? "Saqlanmoqda..." : submitLabel}
      </button>
    </form>
  );
}
