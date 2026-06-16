import { Suspense } from "react";
import type { Metadata } from "next";
import { ListingPageContent } from "@/features/listings/components/ListingPage";

export const metadata: Metadata = {
  title: "Listings — Ulrich Propiedades",
  description:
    "Browse featured luxury listings. Filter by location, property type, and transaction type.",
};

export default function ListingsPage() {
  // Suspense required: ListingPageContent reads useSearchParams for deep-linked filters.
  return (
    <Suspense>
      <ListingPageContent />
    </Suspense>
  );
}
