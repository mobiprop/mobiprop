import type { Metadata } from "next";
import { FAQ } from "@/features/home/FAQ";
import { Agents } from "@/features/home/Agents";
import { ConsultationBanner } from "@/features/home/ConsultationBanner";
import { AboutUsContent } from "@/features/about/AboutUs";
import { getPublicTeam } from "@/features/home/getPublicTeam";

export const metadata: Metadata = {
  title: "About Us — Ulrich Propiedades",
  description:
    "Where global property meets local expertise. Learn about Ulrich's story, expertise, and the team behind every home.",
};

export default async function AboutPage() {
  const teamMembers = await getPublicTeam();

  return (
    <>
      <AboutUsContent />
      <FAQ />
      <Agents members={teamMembers} />
      <ConsultationBanner />
    </>
  );
}
