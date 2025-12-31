"use client";

import { useEffect } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[app.error]", error);
  }, [error]);

  return (
    <main style={{ width: "100%", maxWidth: "1200px", margin: "0 auto", padding: "48px 16px" }}>
      <EmptyState
        title="Something went wrong"
        description="Please try again. If this keeps happening, contact support."
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
  );
}


