"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";

/**
 * Client-side providers wrapper
 * Add all client-side context providers here
 */
export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

