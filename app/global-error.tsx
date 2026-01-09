"use client";

import Link from "next/link";
import { useEffect } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
     
    console.error("[app.global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "48px 16px" }}>
          <EmptyState
            title="We hit an unexpected error"
            description="Please retry. If it continues, contact support and include the Error ID below."
            action={
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" onClick={reset} className="btn">
                  Retry
                </button>
                <Link className="btnSecondary" href="/">
                  Go home
                </Link>
              </div>
            }
          />
          {error?.digest && (
            <p style={{ marginTop: 12, textAlign: "center", opacity: 0.7 }}>
              Error ID: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}


