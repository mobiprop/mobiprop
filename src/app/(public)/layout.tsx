import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getNavUser } from "@/lib/nav-user";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const navUser = await getNavUser();
  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <Navbar initialUser={navUser} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
