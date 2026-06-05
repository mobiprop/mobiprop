// Role-based permission helpers — placeholder

export type Role = "admin" | "agent" | "user";

export function can(role: Role, action: string): boolean {
  // TODO: implement RBAC logic
  void action;
  return role === "admin";
}
