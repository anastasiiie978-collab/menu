"use client";

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
        }
      }}
    >
      <button
        type="submit"
        className="min-h-9 shrink-0 rounded-md border border-panel-2 px-3 text-xs text-red-400"
      >
        O&apos;chirish
      </button>
    </form>
  );
}
