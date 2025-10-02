"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginPage() {
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sp = useSearchParams();
  const r = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(null); setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const res = await signIn("credentials", {
      email, password, redirect: false, callbackUrl: sp.get("callbackUrl") || "/dashboard",
    });

    setLoading(false);
    if (res?.ok) r.push(res.url ?? "/dashboard");
    else setErr(res?.error || "Invalid credentials");
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Welcome back</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="email" placeholder="you@example.com" className="w-full rounded border p-2" />
        <input name="password" type="password" placeholder="Password" className="w-full rounded border p-2" />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="w-full rounded bg-black px-3 py-2 text-white">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
