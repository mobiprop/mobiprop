import { redirect } from "next/navigation";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getCurrentProfile } from "@/lib/auth";
import { getNavUser } from "@/lib/nav-user";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Defense-in-depth: the account area requires a signed-in user (the proxy
  // also guards this, but never rely on middleware alone).
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  // Inactive/suspended accounts get no usable area. (The session itself is
  // revoked at next sign-in by the auth callback.)
  if (profile.status !== "ACTIVE") redirect("/login?error=account_not_active");
  // The account area is for USER role only — staff belong in the CRM and must
  // never see the public account/profile pages.
  if (profile.role !== "USER") redirect("/dashboard");

  const navUser = await getNavUser();
  if (!navUser) redirect("/login");
  return (
    <div data-public-site className="flex min-h-screen flex-col bg-[#fafafa]">
      <Navbar initialUser={navUser} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
