"use client";

import { Toaster } from "sonner";

import { QueryProvider } from "@/providers/query-provider";
import { GlobalLoadingBar } from "@/components/common/GlobalLoadingBar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <GlobalLoadingBar />
      {children}
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}
