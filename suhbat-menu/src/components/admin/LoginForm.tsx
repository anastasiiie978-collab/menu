"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-2 text-left">
        <span className="font-heading text-xs tracking-wide text-muted">Admin paroli</span>
        <input
          type="password"
          name="password"
          required
          autoFocus
          className="min-h-14 rounded-lg border border-panel-2 bg-surface px-4 text-base text-cream outline-none focus:border-gold"
        />
      </label>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="min-h-14 rounded-lg bg-gold px-6 font-heading text-base tracking-wide text-canvas transition-opacity disabled:opacity-60"
      >
        {pending ? "Tekshirilmoqda..." : "Kirish"}
      </button>
    </form>
  );
}
