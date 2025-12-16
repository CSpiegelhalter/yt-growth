"use client";

import { useState } from "react";
import Link from "next/link";
import type { Session } from "next-auth";

export function Header({ session }: { session: Session | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        marginBottom: 24,
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          fontWeight: 700,
          fontSize: "1.125rem",
          color: "#1a1a2e",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: "1.5rem" }}>📈</span>
        <span className="hidden-mobile" style={{ display: "none" }}>
          YT Growth
        </span>
      </Link>

      {/* Desktop Nav */}
      <nav
        style={{
          display: "none",
          gap: 24,
          alignItems: "center",
        }}
        className="desktop-nav"
      >
        {session && (
          <>
            <Link
              href="/dashboard"
              style={{ color: "#64748b", textDecoration: "none", fontSize: "0.875rem" }}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              style={{ color: "#64748b", textDecoration: "none", fontSize: "0.875rem" }}
            >
              Profile
            </Link>
          </>
        )}
      </nav>

      {/* User section */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {session ? (
          <>
            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                cursor: "pointer",
              }}
              className="mobile-only"
            >
              <span style={{ fontSize: "1.25rem" }}>☰</span>
            </button>
            
            {/* User avatar/name - desktop */}
            <div
              className="desktop-only"
              style={{
                display: "none",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#64748b",
                }}
              >
                {session.user?.email}
              </span>
              <Link
                href="/api/auth/signout"
                style={{
                  fontSize: "0.875rem",
                  color: "#dc2626",
                  textDecoration: "none",
                }}
              >
                Sign out
              </Link>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/auth/login"
              style={{
                padding: "8px 16px",
                fontSize: "0.875rem",
                color: "#64748b",
                textDecoration: "none",
              }}
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              style={{
                padding: "8px 16px",
                fontSize: "0.875rem",
                fontWeight: 500,
                background: "#2563eb",
                color: "white",
                textDecoration: "none",
                borderRadius: 8,
              }}
            >
              Sign up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {menuOpen && session && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 0,
            right: 0,
            background: "white",
            borderBottom: "1px solid #e2e8f0",
            padding: 16,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            style={{
              padding: "12px 16px",
              background: "#f8fafc",
              borderRadius: 8,
              textDecoration: "none",
              color: "#1a1a2e",
            }}
          >
            📊 Dashboard
          </Link>
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            style={{
              padding: "12px 16px",
              background: "#f8fafc",
              borderRadius: 8,
              textDecoration: "none",
              color: "#1a1a2e",
            }}
          >
            👤 Profile
          </Link>
          <Link
            href="/api/auth/signout"
            onClick={() => setMenuOpen(false)}
            style={{
              padding: "12px 16px",
              background: "#fef2f2",
              borderRadius: 8,
              textDecoration: "none",
              color: "#dc2626",
            }}
          >
            Sign out
          </Link>
        </div>
      )}

      <style jsx global>{`
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-only {
            display: flex !important;
          }
          .mobile-only {
            display: none !important;
          }
          .hidden-mobile {
            display: inline !important;
          }
        }
      `}</style>
    </header>
  );
}
