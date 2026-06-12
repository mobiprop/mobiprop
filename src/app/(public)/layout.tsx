import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getNavUser } from "@/lib/nav-user";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Product rule: everyone — guests, USER accounts, and signed-in staff — can
  // browse the public site. Staff keep their session and get a Dashboard link
  // in the navbar; the dashboard itself stays guarded by requireDashboardAccess().
  const navUser = await getNavUser();
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <Navbar initialUser={navUser} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
