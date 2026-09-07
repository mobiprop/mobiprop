import { HeroSection } from "@/features/home/HeroSection";
import { FeaturedListings } from "@/features/home/FeaturedListings";
import { FeaturedSpots } from "@/features/home/FeaturedSpots";
import { HowItWorks } from "@/features/home/HowItWorks";
import { WhyUs } from "@/features/home/WhyUs";
import { OurServices } from "@/features/home/OurServices";
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
      <WhyUs />
      <OurServices />
      <Agents members={teamMembers} />
      <Testimonial />
      <FAQ />
      <Blog />
      <ConsultationBanner />
    </>
  );
}
