"use client";

import { deleteDishAction } from "@/app/admin/actions";

export function DeleteDishButton({ dishId, dishName }: { dishId: string; dishName: string }) {
  const action = deleteDishAction.bind(null, dishId);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`"${dishName}"ni o'chirishni tasdiqlaysizmi?`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="min-h-11 min-w-11 rounded-md border border-panel-2 px-3 text-sm text-red-400"
      >
        O&apos;chirish
      </button>
    </form>
  );
}
