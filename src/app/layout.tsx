import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME, isSupportedLanguage } from "@/i18n/config";

export const metadata: Metadata = {
  title: "Mobi Prop — Your Gateway to Exclusive Properties",
  description:
    "Discover exclusive homes for sale and rent. Mobi Prop helps you find your perfect property.",
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const storedLang = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;
  const lang = isSupportedLanguage(storedLang) ? storedLang : DEFAULT_LANGUAGE;

  return (
    <html lang={lang} className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers initialLanguage={lang}>{children}</Providers>
      </body>
    </html>
  );
}
