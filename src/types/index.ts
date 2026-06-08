// Shared TypeScript types

// Single source of truth for roles/status — re-exported from the Prisma client so
// application code and the database schema never drift apart. Each name is both a
// runtime value (const object) and a type in Prisma's generated output.
import type { UserRole } from "@/generated/prisma/enums";

export { UserRole, UserStatus, AgentInvitationStatus } from "@/generated/prisma/enums";

// Backwards-compatible alias used in older code paths.
export type Role = UserRole;

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
