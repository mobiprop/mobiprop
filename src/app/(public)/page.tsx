import { HeroSection } from "@/features/home/HeroSection";
import { FeaturedListings } from "@/features/home/FeaturedListings";
import { FeaturedSpots } from "@/features/home/FeaturedSpots";
import { WhyUs } from "@/features/home/WhyUs";
import { OurServices } from "@/features/home/OurServices";
import { Agents } from "@/features/home/Agents";
import { Testimonial } from "@/features/home/Testimonial";
import { FAQ } from "@/features/home/FAQ";
import { Blog } from "@/features/home/Blog";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturedListings />
      <FeaturedSpots />
      <WhyUs />
      <OurServices />
      <Agents />
      <Testimonial />
      <FAQ />
      <Blog />
      <ConsultationBanner />
    </>
  );
}
