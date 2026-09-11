import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentProfile } from "@/lib/auth";
import { getSavedListings } from "@/features/listings/saved-actions";
import { SavedListingsPageContent } from "@/features/listings/components/SavedListingsPage";

export const metadata: Metadata = {
  title: "Propiedades guardadas — Mobi Prop",
  description: "Propiedades que guardaste para consultar más adelante.",
};

export default async function SavedListingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const result = await getSavedListings();
  const listings = result.ok ? result.listings : [];

  return <SavedListingsPageContent initialListings={listings} />;
}
