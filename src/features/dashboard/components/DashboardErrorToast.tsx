"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  not_authorized: "You don't have permission to access that page.",
};

/**
 * Surfaces `?error=` flags set by server-side guards (e.g.
 * requireDashboardAccess redirecting an AGENT away from /dashboard/agents)
 * as a toast, then strips the param so a refresh doesn't re-fire it.
 */
export function DashboardErrorToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (!error) return;
    toast.error(ERROR_MESSAGES[error] ?? "Something went wrong.");
    router.replace(pathname, { scroll: false });
  }, [error, pathname, router]);

  return null;
}
