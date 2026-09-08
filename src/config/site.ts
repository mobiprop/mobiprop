// Site-wide configuration

export const siteConfig = {
  name: "Mobi Prop",
  description: "Tu inmobiliaria de confianza",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ogImage: "/assets/og-image.png",
  links: {
    instagram: "https://instagram.com/mobiprop",
    facebook: "https://facebook.com/mobiprop",
  },
};

export type SiteConfig = typeof siteConfig;
