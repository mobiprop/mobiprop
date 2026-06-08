// Centralized role-based access control.
//
// This is the single source of truth for "what can a role do". UI (sidebar
// filtering), route guards, and API handlers all read from this map — never
// hardcode role checks inline elsewhere.

import { UserRole } from "@/generated/prisma/enums";

export type Role = UserRole;

export type Permission =
  | "dashboard:view"
  | "dashboard:viewCompanyRevenue"
  | "agents:view"
  | "agents:create"
  | "agents:update"
  | "agents:deactivate"
  | "agents:invite"
  | "contacts:view"
  | "contacts:create"
  | "contacts:update"
  | "contacts:delete"
  | "listings:view"
  | "listings:create"
  | "listings:update"
  | "listings:delete"
  | "listings:assign"
  | "leads:view"
  | "leads:create"
  | "leads:update"
  | "leads:convert"
  | "opportunities:view"
  | "opportunities:create"
  | "opportunities:update"
  | "contracts:view"
  | "contracts:create"
  | "contracts:update"
  | "contracts:uploadDocuments"
  | "integrations:view"
  | "integrations:manage"
  | "locations:view"
  | "locations:manage"
  | "activityLogs:view"
  | "settings:view"
  | "settings:manage"
  | "messages:view"
  | "notifications:view";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "dashboard:viewCompanyRevenue",
    "agents:view",
    "agents:create",
    "agents:update",
    "agents:deactivate",
    "agents:invite",
    "contacts:view",
    "contacts:create",
    "contacts:update",
    "contacts:delete",
    "listings:view",
    "listings:create",
    "listings:update",
    "listings:delete",
    "listings:assign",
    "leads:view",
    "leads:create",
    "leads:update",
    "leads:convert",
    "opportunities:view",
    "opportunities:create",
    "opportunities:update",
    "contracts:view",
    "contracts:create",
    "contracts:update",
    "contracts:uploadDocuments",
    "integrations:view",
    "integrations:manage",
    "locations:view",
    "locations:manage",
    "activityLogs:view",
    "settings:view",
    "settings:manage",
    "messages:view",
    "notifications:view",
  ],
  MANAGER: [
    "dashboard:view",
    "agents:view",
    "contacts:view",
    "contacts:create",
    "contacts:update",
    "listings:view",
    "listings:create",
    "listings:update",
    "listings:assign",
    "leads:view",
    "leads:create",
    "leads:update",
    "leads:convert",
    "opportunities:view",
    "opportunities:create",
    "opportunities:update",
    "contracts:view",
    "contracts:create",
    "contracts:update",
    "contracts:uploadDocuments",
    "locations:view",
    "messages:view",
    "notifications:view",
    "settings:view",
  ],
  AGENT: [
    "dashboard:view",
    "contacts:view",
    "listings:view",
    "listings:create",
    "listings:update",
    "leads:view",
    "leads:update",
    "leads:convert",
    "opportunities:view",
    "opportunities:update",
    "contracts:view",
    "messages:view",
    "notifications:view",
    "settings:view",
  ],
  CLIENT: ["notifications:view"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

const DASHBOARD_ROLES: Role[] = [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT];

export function canAccessDashboard(role: Role): boolean {
  return DASHBOARD_ROLES.includes(role);
}
