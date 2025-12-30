"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import s from "./LearnCTA.module.css";
import { apiFetchJson } from "@/lib/client/api";
import type { Me } from "@/types/api";

type AuthState = "loading" | "signed-out" | "signed-in";

type Props = {
  title: string;
  description: string;
  className?: string;
};

/**
 * LearnCTA - Auth-aware CTA for Learn pages
 * Shows different button based on authentication status
 */
export function LearnCTA({ title, description, className }: Props) {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    async function checkAuth() {
      try {
        await apiFetchJson<Me>("/api/me", { cache: "no-store" });
        setAuthState("signed-in");
      } catch {
        setAuthState("signed-out");
      }
    }

    checkAuth();
  }, []);

  const buttonText = authState === "signed-in" ? "Go to Dashboard" : "Get Started";
  const buttonHref = authState === "signed-in" ? "/dashboard" : "/auth/signup";

  return (
    <section className={`${s.cta} ${className ?? ""}`.trim()}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.text}>{description}</p>
      {authState === "loading" ? (
        <div className={s.skeleton} />
      ) : (
        <Link href={buttonHref} className={s.btn}>
          {buttonText}
        </Link>
      )}
    </section>
  );
}

