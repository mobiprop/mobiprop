"use client";

import { Toaster } from "sonner";

import { QueryProvider } from "@/providers/query-provider";
import { GlobalLoadingBar } from "@/components/common/GlobalLoadingBar";
import { I18nProvider } from "@/i18n/I18nProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <QueryProvider>
        <GlobalLoadingBar />
        {children}
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </I18nProvider>
  );
}
