// Shared types + mock data for the dashboard Listings page (list & grid views).

export type ListingType = "Apartment" | "House" | "Commercial" | "Land";
export type ListingStatus = "Active" | "Paused" | "Rented" | "Sold";
export type OperationType = "Sale" | "Rent" | "Both";

export type Listing = {
  id: number;
  listingId: string;
  name: string;
  location: string;
  image: string;
  type: ListingType;
  price: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  operation: OperationType;
  status: ListingStatus;
  views: number;
  featured: boolean;
};

// Property photos that already ship in /public (reused from the landing/profile pages).
const PROP_IMAGES = [
  "/assets/figma-temp/UserProfile/prop-0.png",
  "/assets/figma-temp/UserProfile/prop-1.png",
  "/assets/figma-temp/UserProfile/prop-2.png",
  "/assets/figma-temp/UserProfile/prop-3.png",
  "/assets/figma-temp/UserProfile/prop-4.png",
  "/assets/figma-temp/UserProfile/prop-5.png",
];

export const TYPE_BADGE: Record<ListingType, { bg: string; text: string }> = {
  Apartment:  { bg: "#fef3c6", text: "#bb4d00" },
  House:      { bg: "#dff2fe", text: "#0069a8" },
  Commercial: { bg: "#dcfce7", text: "#008236" },
  Land:       { bg: "#ede9fe", text: "#6d28d9" },
};

export const STATUS_BADGE: Record<ListingStatus, { bg: string; text: string }> = {
  Active: { bg: "#dcfce7", text: "#008236" },
  Paused: { bg: "#fef3c6", text: "#e17100" },
  Rented: { bg: "#dff2fe", text: "#0069a8" },
  Sold:   { bg: "#fee2e2", text: "#e7000b" },
};

export const MOCK_LISTINGS: Listing[] = [
  { id: 1, listingId: "LST-0001", name: "Modern Downtown Apartment", location: "Buenos Aires, Argentina", image: PROP_IMAGES[0], type: "Apartment",  price: "$450,000", bedrooms: 3, bathrooms: 2, area: 1200, operation: "Sale", status: "Rented", views: 342, featured: true  },
  { id: 2, listingId: "LST-0002", name: "Modern Downtown Apartment", location: "Buenos Aires, Argentina", image: PROP_IMAGES[1], type: "House",      price: "$450,000", bedrooms: 3, bathrooms: 2, area: 1200, operation: "Rent", status: "Paused", views: 342, featured: false },
  { id: 3, listingId: "LST-0003", name: "Modern Downtown Apartment", location: "Buenos Aires, Argentina", image: PROP_IMAGES[2], type: "Apartment",  price: "$450,000", bedrooms: 3, bathrooms: 2, area: 1200, operation: "Both", status: "Active", views: 342, featured: true  },
  { id: 4, listingId: "LST-0004", name: "Modern Downtown Apartment", location: "Buenos Aires, Argentina", image: PROP_IMAGES[3], type: "House",      price: "$450,000", bedrooms: 3, bathrooms: 2, area: 1200, operation: "Sale", status: "Sold",   views: 342, featured: false },
  { id: 5, listingId: "LST-0005", name: "Modern Downtown Apartment", location: "Buenos Aires, Argentina", image: PROP_IMAGES[4], type: "Apartment",  price: "$450,000", bedrooms: 3, bathrooms: 2, area: 1200, operation: "Both", status: "Active", views: 342, featured: false },
  { id: 6, listingId: "LST-0006", name: "Modern Downtown Apartment", location: "Buenos Aires, Argentina", image: PROP_IMAGES[5], type: "Commercial", price: "$450,000", bedrooms: 3, bathrooms: 2, area: 1200, operation: "Rent", status: "Paused", views: 342, featured: false },
];
