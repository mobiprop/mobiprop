export type LocationDistribution = {
  houses: number;
  apartments: number;
  lots: number;
  commercial: number;
};

export type LocationActivityKind = "created" | "sold" | "updated";

export type LocationActivityDto = {
  id: string;
  kind: LocationActivityKind;
  description: string;
  createdAt: string;
};

export type LocationDto = {
  id: string;
  locationId: string;
  name: string;
  region: string;
  address: string;
  postalCode: string;
  coordinates: { lat: number; lng: number };
  growthPercent: number;
  properties: number;
  active: number;
  sold: number;
  revenue: number;
  agents: number;
  avgPricePerM2: number;
  distribution: LocationDistribution;
  activity: LocationActivityDto[];
  createdAt: string;
  updatedAt: string;
};

// Minimal shape for the listing-form autocomplete — no stats/revenue, so it
// can be served to any authenticated staff member regardless of whether they
// hold the `locations:view` permission.
export type LocationSuggestionDto = {
  id: string;
  name: string;
  region: string;
  address: string;
};
