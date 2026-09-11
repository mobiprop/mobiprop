"use client";

import { Toaster } from "sonner";
import { SpanishFormValidation } from "@/components/common/SpanishFormValidation";

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
        <SpanishFormValidation />
        <GlobalLoadingBar />
        {children}
        <Toaster containerAriaLabel="Notificaciones" richColors position="top-right" />
      </QueryProvider>
    </I18nProvider>
  );
}
