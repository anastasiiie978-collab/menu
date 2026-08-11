import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6">
      <p className="font-heading text-xs tracking-[0.35em] text-muted">SUHBAT</p>
      <h1 className="mt-2 mb-8 font-display text-2xl italic text-gold-light">Admin panel</h1>
      <LoginForm />
    </main>
  );
}
