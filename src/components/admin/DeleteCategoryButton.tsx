"use client";

import { useState } from "react";
import { deleteCategoryAction } from "@/app/admin/actions";

export function DeleteCategoryButton({
  categoryId,
  categoryName,
  dishCount,
}: {
  categoryId: string;
  categoryName: string;
  dishCount: number;
}) {
  const [pending, setPending] = useState(false);
  const action = deleteCategoryAction.bind(null, categoryId);
  const warning =
    dishCount > 0
      ? `"${categoryName}" toifasini o'chirsangiz, undagi ${dishCount} ta taom ham o'chib ketadi. Davom etasizmi?`
      : `"${categoryName}" toifasini o'chirishni tasdiqlaysizmi?`;

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(warning)) {
          e.preventDefault();
          return;
        }
        // Disable immediately so a slow connection (or an impatient second tap)
        // can't fire the delete twice before the redirect back to the dashboard
        // completes.
        setPending(true);
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 shrink-0 rounded-md border border-panel-2 px-3 text-xs text-red-400 disabled:opacity-60"
      >
        {pending ? "..." : "O'chirish"}
      </button>
    </form>
  );
}
