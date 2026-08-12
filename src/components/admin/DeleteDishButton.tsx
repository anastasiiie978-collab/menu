"use client";

import { useState } from "react";
import { deleteDishAction } from "@/app/admin/actions";

export function DeleteDishButton({ dishId, dishName }: { dishId: string; dishName: string }) {
  const [pending, setPending] = useState(false);
  const action = deleteDishAction.bind(null, dishId);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`"${dishName}"ni o'chirishni tasdiqlaysizmi?`)) {
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
        className="min-h-11 min-w-11 rounded-md border border-panel-2 px-3 text-sm text-red-400 disabled:opacity-60"
      >
        {pending ? "..." : "O'chirish"}
      </button>
    </form>
  );
}
