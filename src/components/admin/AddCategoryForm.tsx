"use client";

import { useActionState } from "react";
import { createCategoryAction } from "@/app/admin/actions";

export function AddCategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="Yangi toifa nomi"
          required
          maxLength={100}
          className="min-h-11 flex-1 rounded-md border border-panel-2 bg-surface px-3 text-sm text-cream outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 shrink-0 rounded-md bg-gold px-4 font-heading text-xs tracking-wide text-canvas disabled:opacity-60"
        >
          {pending ? "..." : "Qo'shish"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
