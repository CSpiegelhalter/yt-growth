"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          setAuthState("signed-out");
          return;
        }
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
    <section className={className}>
      <h2 style={styles.title}>{title}</h2>
      <p style={styles.text}>{description}</p>
      {authState === "loading" ? (
        <div style={styles.skeleton} />
      ) : (
        <Link href={buttonHref} style={styles.btn}>
          {buttonText}
        </Link>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: "8px",
  },
  text: {
    fontSize: "1rem",
    opacity: 0.9,
    marginBottom: "24px",
    maxWidth: "400px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 32px",
    fontSize: "1rem",
    fontWeight: 600,
    background: "white",
    color: "#1e3a5f",
    borderRadius: "10px",
    textDecoration: "none",
    transition: "all 0.15s ease",
  },
  skeleton: {
    width: "140px",
    height: "48px",
    background: "rgba(255, 255, 255, 0.2)",
    borderRadius: "10px",
    margin: "0 auto",
  },
};

