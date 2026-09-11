import { APP_URL } from "@/lib/constants";

// Site-wide configuration

export const siteConfig = {
  name: "Mobi Prop",
  description: "Tu inmobiliaria de confianza",
  url: APP_URL,
  ogImage: "/assets/og-image.png",
  links: {
    instagram: "https://instagram.com/mobiprop",
    facebook: "https://facebook.com/mobiprop",
  },
};

export type SiteConfig = typeof siteConfig;
