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
  | "agents:delete"
  | "agents:invite"
  // Invitation management (list/resend/revoke) is ADMIN-only in phase 1.
  // Future option (needs client sign-off): grant MANAGER "agents:invite" to let
  // managers invite AGENTs — createAgentInvitation already restricts non-ADMIN
  // inviters to the AGENT role, so enabling it is just adding the permission.
  | "invitations:view"
  | "invitations:resend"
  | "invitations:revoke"
  // Separate, narrower gate on top of "agents:invite": lets an inviter create
  // an ADMIN-role invitation. Kept distinct so it can stay ADMIN-only even if
  // "agents:invite" is ever extended to MANAGER.
  | "invitations:inviteAdmin"
  | "contacts:view"
  // Unscoped visibility. ADMIN/MANAGER hold this; AGENT holders only see
  // contacts they created/are assigned to, or that are linked to a lead,
  // listing, opportunity, or tour assigned to them (record-level check in
  // the contact actions) — mirrors the leads:view_all pattern.
  | "contacts:view_all"
  | "contacts:create"
  | "contacts:update"
  | "contacts:delete"
  | "contacts:archive"
  | "contacts:viewMetrics"
  | "contacts:export"
  | "contacts:import"
  | "listings:view"
  | "listings:create"
  | "listings:update"
  | "listings:delete"
  | "listings:assign"
  // Pause/feature/image management per the listings plan. AGENT holders are
  // additionally limited to created/assigned listings (record-level check in
  // the listing actions).
  | "listings:pause"
  | "listings:feature"
  | "listings:uploadImages"
  | "leads:view"
  | "leads:view_all"
  | "leads:create"
  | "leads:update"
  | "leads:assign"
  | "leads:change_status"
  | "leads:change_score"
  | "leads:add_note"
  | "leads:archive"
  | "leads:convert"
  | "leads:export"
  | "leads:view_activity"
  | "tours:view"
  | "tours:view_all"
  | "tours:create"
  | "tours:update"
  | "tours:assign"
  | "opportunities:view"
  // Unscoped visibility. ADMIN/MANAGER hold this; AGENT holders only see
  // opportunities/contracts they created or are assigned to (record-level
  // check in the opportunity/contract actions) — this is the one place
  // AGENT visibility stays scoped, per the client's Milestone 3 decision.
  | "opportunities:view_all"
  | "opportunities:create"
  | "opportunities:update"
  | "opportunities:delete"
  | "contracts:view"
  | "contracts:view_all"
  | "contracts:create"
  | "contracts:update"
  | "contracts:delete"
  | "contracts:uploadDocuments"
  // All staff hold "view" (the page also hosts each agent's own Google
  // Calendar connection — a personal setting, not an org-wide one). "manage"
  // stays ADMIN-only — it gates the org-wide mock integrations (Mailchimp,
  // Stripe, etc.), not an agent's personal calendar connect/disconnect.
  | "integrations:view"
  | "integrations:manage"
  | "locations:view"
  | "locations:manage"
  // Blog / CMS module. AGENT holders can author and edit drafts; publishing and
  // deleting stay with ADMIN/MANAGER so agents can't push content live alone.
  | "blog:view"
  | "blog:create"
  | "blog:update"
  | "blog:publish"
  | "blog:delete"
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
    "agents:delete",
    "agents:invite",
    "invitations:view",
    "invitations:resend",
    "invitations:revoke",
    "invitations:inviteAdmin",
    "contacts:view",
    "contacts:view_all",
    "contacts:create",
    "contacts:update",
    "contacts:delete",
    "contacts:archive",
    "contacts:viewMetrics",
    "contacts:export",
    "contacts:import",
    "listings:view",
    "listings:create",
    "listings:update",
    "listings:delete",
    "listings:assign",
    "listings:pause",
    "listings:feature",
    "listings:uploadImages",
    "leads:view",
    "leads:view_all",
    "leads:create",
    "leads:update",
    "leads:assign",
    "leads:change_status",
    "leads:change_score",
    "leads:add_note",
    "leads:archive",
    "leads:convert",
    "leads:export",
    "leads:view_activity",
    "tours:view",
    "tours:view_all",
    "tours:create",
    "tours:update",
    "tours:assign",
    "opportunities:view",
    "opportunities:view_all",
    "opportunities:create",
    "opportunities:update",
    "opportunities:delete",
    "contracts:view",
    "contracts:view_all",
    "contracts:create",
    "contracts:update",
    "contracts:delete",
    "contracts:uploadDocuments",
    "blog:view",
    "blog:create",
    "blog:update",
    "blog:publish",
    "blog:delete",
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
    "dashboard:viewCompanyRevenue",
    "agents:view",
    "contacts:view",
    "contacts:view_all",
    "contacts:create",
    "contacts:update",
    "contacts:archive",
    "contacts:viewMetrics",
    "contacts:export",
    "contacts:import",
    "listings:view",
    "listings:create",
    "listings:update",
    "listings:delete",
    "listings:assign",
    "listings:pause",
    "listings:feature",
    "listings:uploadImages",
    "leads:view",
    "leads:view_all",
    "leads:create",
    "leads:update",
    "leads:assign",
    "leads:change_status",
    "leads:change_score",
    "leads:add_note",
    "leads:archive",
    "leads:convert",
    "leads:export",
    "leads:view_activity",
    "tours:view",
    "tours:view_all",
    "tours:create",
    "tours:update",
    "tours:assign",
    "opportunities:view",
    "opportunities:view_all",
    "opportunities:create",
    "opportunities:update",
    "opportunities:delete",
    "contracts:view",
    "contracts:view_all",
    "contracts:create",
    "contracts:update",
    "contracts:delete",
    "contracts:uploadDocuments",
    "blog:view",
    "blog:create",
    "blog:update",
    "blog:publish",
    "blog:delete",
    "integrations:view",
    "locations:view",
    "messages:view",
    "notifications:view",
    "settings:view",
  ],
  AGENT: [
    "dashboard:view",
    "integrations:view",
    "contacts:view",
    "contacts:view_all",
    "contacts:create",
    "contacts:update",
    "listings:view",
    "listings:create",
    "listings:update",
    "listings:delete",
    "listings:pause",
    "listings:uploadImages",
    "leads:view",
    "leads:view_all",
    "leads:create",
    "leads:update",
    "leads:change_status",
    "leads:change_score",
    "leads:add_note",
    "leads:convert",
    "leads:view_activity",
    "tours:view",
    "tours:create",
    "tours:update",
    // Opportunities/contracts deliberately stay scoped — no *:view_all here.
    // Record-level own/assigned checks live in the opportunity/contract actions.
    // Delete is deliberately withheld from AGENT (ADMIN/MANAGER only) — the
    // client's decision grants agents full create/edit on their own/assigned
    // opportunities/contracts but doesn't extend to deleting revenue records.
    "opportunities:view",
    "opportunities:create",
    "opportunities:update",
    "contracts:view",
    "contracts:create",
    "contracts:update",
    "contracts:uploadDocuments",
    "blog:view",
    "blog:create",
    "blog:update",
    "messages:view",
    "notifications:view",
    "settings:view",
  ],
  USER: ["notifications:view"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isAdmin(role: Role): boolean {
  return role === UserRole.ADMIN;
}

export function isStaffRole(role: Role): boolean {
  return (
    role === UserRole.ADMIN || role === UserRole.MANAGER || role === UserRole.AGENT
  );
}

const DASHBOARD_ROLES: Role[] = [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT];

export function canAccessDashboard(role: Role): boolean {
  return DASHBOARD_ROLES.includes(role);
}
