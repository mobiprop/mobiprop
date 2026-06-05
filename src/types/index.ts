// Shared TypeScript types

export type Role = "admin" | "agent" | "user";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  price: number;
  description?: string;
  images: string[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt?: string;
}
