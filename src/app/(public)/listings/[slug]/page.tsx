import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicListingBySlug } from "@/features/listings/listing-actions";
import { SingleListingPageContent } from "@/features/listings/components/SingleListingPage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicListingBySlug(slug);
  if (!result) {
    return { title: "Property Not Found — Mobi Prop" };
  }
  const { listing } = result;
  return {
    title: `${listing.title} — Mobi Prop`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 160),
      images: listing.coverImageUrl ? [listing.coverImageUrl] : undefined,
    },
  };
}

export default async function SingleListingPage({ params }: Props) {
  const { slug } = await params;
  const result = await getPublicListingBySlug(slug);
  if (!result) notFound();

  return <SingleListingPageContent listing={result.listing} agent={result.agent} />;
}
