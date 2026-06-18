import type { Metadata } from "next";

import { requireDashboardAccess } from "@/lib/auth";
import { TourDetailPage } from "@/features/dashboard/TourDetailPage";

export const metadata: Metadata = { title: "Tour Detail — Ulrich Propiedades" };

type Props = { params: Promise<{ tourId: string }> };

export default async function DashboardTourDetailPage({ params }: Props) {
  const { tourId } = await params;
  const profile = await requireDashboardAccess("tours:view");
  return <TourDetailPage tourId={tourId} role={profile.role} />;
}
