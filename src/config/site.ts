// Site-wide configuration

export const siteConfig = {
  name: "Ulrich Propiedades",
  description: "Tu inmobiliaria de confianza",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ogImage: "/assets/og-image.png",
  links: {
    instagram: "https://instagram.com/ulrichpropiedades",
    facebook: "https://facebook.com/ulrichpropiedades",
  },
};

export type SiteConfig = typeof siteConfig;
