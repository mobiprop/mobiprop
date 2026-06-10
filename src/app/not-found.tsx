import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getNavUser } from "@/lib/nav-user";
import { NotFoundPage } from "@/features/not-found/NotFoundPage";

export default async function NotFound() {
  const navUser = await getNavUser();

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <Navbar initialUser={navUser} />
      <main className="flex-1">
        <NotFoundPage />
      </main>
      <Footer />
    </div>
  );
}
