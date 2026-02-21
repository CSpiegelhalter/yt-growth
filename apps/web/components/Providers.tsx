"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/Toast";
import { ClientErrorReporter } from "@/components/ClientErrorReporter";

/**
 * Client-side providers wrapper
 * Add all client-side context providers here
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ClientErrorReporter />
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}

