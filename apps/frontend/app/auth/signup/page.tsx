"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const r = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "");
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) r.push("/auth/login?signup=1");
    else {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Sign up failed");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="mb-4 text-xl font-semibold">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="name" placeholder="Full name" className="w-full rounded border p-2" />
        <input name="email" placeholder="you@example.com" className="w-full rounded border p-2" />
        <input name="password" type="password" placeholder="Password" className="w-full rounded border p-2" />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={loading} className="w-full rounded bg-black px-3 py-2 text-white">
          {loading ? "Creating..." : "Sign up"}
        </button>
      </form>
    </div>
  );
}
