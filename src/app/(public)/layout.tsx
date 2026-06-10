import { redirect } from "next/navigation";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getNavUser } from "@/lib/nav-user";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const navUser = await getNavUser();
  // Product rule: signed-in staff (ADMIN/MANAGER/AGENT) live in the CRM and are
  // redirected off the public site. Guests and USER accounts browse freely.
  if (navUser?.canAccessDashboard) redirect("/dashboard");
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <Navbar initialUser={navUser} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
