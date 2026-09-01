"use client";

import Link from "next/link";
import { useEffect } from "react";

// The admin pages load their data during the server render (getMenu / getCategories /
// getDishById). Those throw if Supabase is unreachable, and without this boundary a
// non-technical manager mid-shift would see Next.js's generic English crash screen.
// The server actions handle their own failures; this covers the initial render only.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page failed to render:", error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-heading text-xs tracking-[0.35em] text-muted">SUHBAT</p>
      <h1 className="mt-3 font-display text-2xl italic text-gold-light">
        Ma&apos;lumotlarni yuklab bo&apos;lmadi
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Internet aloqasini tekshirib, qaytadan urinib ko&apos;ring. Muammo takrorlansa,
        birozdan keyin yana kiring.
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-8 flex min-h-14 w-full items-center justify-center rounded-lg bg-gold px-6 font-heading text-base tracking-wide text-on-gold"
      >
        Qaytadan urinish
      </button>

      <Link
        href="/admin/dashboard"
        className="mt-3 flex min-h-11 items-center text-sm text-muted underline underline-offset-4"
      >
        Admin panelga qaytish
      </Link>
    </main>
  );
}
