import { redirect } from "next/navigation";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getNavUser } from "@/lib/nav-user";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const navUser = await getNavUser();
  // Defense-in-depth: the account area requires a signed-in user (the proxy
  // also guards this, but never rely on middleware alone).
  if (!navUser) redirect("/login");
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <Navbar initialUser={navUser} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
