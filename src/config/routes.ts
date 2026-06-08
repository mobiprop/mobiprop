// Centralised route constants

export const ROUTES = {
  home: "/",
  about: "/about",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  listings: "/listings",
  listing: (slug: string) => `/listings/${slug}`,
  contact: "/contact",
  faq: "/faq",
  privacyPolicy: "/privacy-policy",
  termsConditions: "/terms-conditions",
  login: "/login",
  register: "/register",
  verifyOtp: "/verify-otp",
  resetPassword: "/reset-password",
  profile: "/profile",
  // Staff / CRM
  dashboard: "/dashboard",
  dashboardLogin: "/dashboard-login",
  acceptInvite: "/accept-invite",
} as const;
