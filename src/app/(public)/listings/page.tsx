import { Suspense } from "react";
import type { Metadata } from "next";
import { ListingPageContent } from "@/features/listings/components/ListingPage";

export const metadata: Metadata = {
  title: "Propiedades — Mobi Prop",
  description: "Explorá nuestras propiedades y filtrá por ubicación, tipo de propiedad y operación.",
};

export default function ListingsPage() {
  // Suspense required: ListingPageContent reads useSearchParams for deep-linked filters.
  return (
    <Suspense>
      <ListingPageContent />
    </Suspense>
  );
}
