"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * LandingSignupCard — name + email capture card on the landing page hero.
 * Collects name and email, then navigates to /auth/signup with them pre-filled.
 */
export function LandingSignupCard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (name) {
      params.set("name", name);
    }
    if (email) {
      params.set("email", email);
    }
    const qs = params.toString();
    router.push(`/auth/signup${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="landingSignupCard">
      <h2>Start with a free account</h2>
      <p>
        Connect your YouTube channel and start getting insights in under 2
        minutes.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="landingSignupInput"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
        <input
          type="email"
          className="landingSignupInput"
          placeholder="email@address.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button type="submit" className="landingSignupBtn">
          Create Free Account
        </button>
      </form>
    </div>
  );
}
