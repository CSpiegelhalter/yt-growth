"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

import { ClientErrorReporter } from "@/components/ClientErrorReporter";
import { ToastProvider } from "@/components/ui/Toast";

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

