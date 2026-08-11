import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-1 flex-col items-center justify-center px-6">
      <Link
        href="/"
        className="absolute left-4 top-4 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm text-muted"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Bosh sahifa
      </Link>

      <p className="font-heading text-xs tracking-[0.35em] text-muted">SUHBAT</p>
      <h1 className="mt-2 mb-8 font-display text-2xl italic text-gold-light">Admin panel</h1>
      <LoginForm />
    </main>
  );
}
