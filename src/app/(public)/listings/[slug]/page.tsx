import type { Metadata } from "next";
import { SingleListingPageContent } from "@/features/listings/components/SingleListingPage";

export const metadata: Metadata = {
  title: "Property Details — Ulrich Propiedades",
  description:
    "View full property details, photos, amenities, location, and contact the listing agent.",
};

export default async function SingleListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  return <SingleListingPageContent />;
}
