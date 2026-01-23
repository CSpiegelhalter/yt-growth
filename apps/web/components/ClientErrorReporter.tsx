"use client";

import { useEffect } from "react";

/**
 * Minimal client-side error capture.
 * We intentionally only log (no stack traces rendered to users).
 */
export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
       
      console.error("[client.error]", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error instanceof Error ? event.error.message : undefined,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
       
      console.error("[client.unhandledrejection]", {
        reason: reason instanceof Error ? reason.message : String(reason),
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}


