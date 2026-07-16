"use client";

import { Toaster } from "sonner";

import { QueryProvider } from "@/providers/query-provider";
import { GlobalLoadingBar } from "@/components/common/GlobalLoadingBar";
import { I18nProvider } from "@/i18n/I18nProvider";
import type { SupportedLanguage } from "@/i18n/config";

export function Providers({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: SupportedLanguage;
}) {
  return (
    <I18nProvider initialLanguage={initialLanguage}>
      <QueryProvider>
        <GlobalLoadingBar />
        {children}
        <Toaster richColors position="top-right" />
      </QueryProvider>
    </I18nProvider>
  );
}
