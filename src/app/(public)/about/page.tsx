import type { Metadata } from "next";
import { Blog } from "@/features/home/Blog";
import { FAQ } from "@/features/home/FAQ";
import { Agents } from "@/features/home/Agents";
import { Testimonial } from "@/features/home/Testimonial";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
import { AboutIntro, AboutGallery } from "@/features/about/AboutUs";
import { getPublicTeam } from "@/features/home/getPublicTeam";

export const metadata: Metadata = {
  title: "Nosotros — Mobi Prop",
  description: "Conocé la historia, experiencia y equipo de Mobi Prop.",
};

export default async function AboutPage() {
  const teamMembers = await getPublicTeam();

  return (
    <>
      <AboutIntro />
      <Testimonial />
      <Agents members={teamMembers} />
      <AboutGallery />
      <FAQ />
      <Blog />
      <ConsultationBanner />
    </>
  );
}
