import { AboutPreview } from "@/features/home/AboutPreview";
import { ListingsExplorer } from "@/features/home/ListingsExplorer";
import { HeroSection } from "@/features/home/HeroSection";
import { FeaturedListings } from "@/features/home/FeaturedListings";
import { FeaturedSpots } from "@/features/home/FeaturedSpots";
import { HowItWorks } from "@/features/home/HowItWorks";
import { Agents } from "@/features/home/Agents";
import { Testimonial } from "@/features/home/Testimonial";
import { FAQ } from "@/features/home/FAQ";
import { Blog } from "@/features/home/Blog";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
import { getPublicTeam } from "@/features/home/getPublicTeam";

export default async function Home() {
  const teamMembers = await getPublicTeam();

  return (
    <>
      <HeroSection />
      <FeaturedListings />
      <FeaturedSpots />
      <HowItWorks />
      <Testimonial />
      <ListingsExplorer />
      <AboutPreview members={teamMembers} />
      <Agents members={teamMembers} />
      <FAQ />
      <Blog />
      <ConsultationBanner />
    </>
  );
}
