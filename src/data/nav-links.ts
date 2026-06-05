// Navigation links data

export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Inicio", href: "/" },
  { label: "Propiedades", href: "/listings" },
  { label: "Nosotros", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contact" },
];
