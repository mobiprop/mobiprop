import type { ReactNode } from "react";

import type { Role } from "@/lib/permissions";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import "../dashboard-brand.css";

type DashboardShellProps = {
  role: Role;
  fullName: string;
  email: string;
  children: ReactNode;
};

export function DashboardShell({ role, fullName, email, children }: DashboardShellProps) {
  return (
    <div className="dashboard-brand flex min-h-screen bg-[#f9fafb]">
      <Sidebar role={role} fullName={fullName} email={email} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
