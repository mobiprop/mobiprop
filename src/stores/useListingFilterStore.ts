import { create } from "zustand";

export type ListingViewMode = "grid" | "list" | "map";
export type TransactionType = "SALE" | "RENT" | "";
export type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "COMMERCIAL_OFFICE"
  | "LOT"
  | "TOWNHOUSE"
  | "";

type ListingFilterState = {
  location: string;
  propertyType: PropertyType;
  transactionType: TransactionType;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  minArea: number | null;
  maxArea: number | null;
  amenities: string[];
  viewMode: ListingViewMode;

  setLocation: (location: string) => void;
  setPropertyType: (propertyType: PropertyType) => void;
  setTransactionType: (transactionType: TransactionType) => void;
  setPriceRange: (minPrice: number | null, maxPrice: number | null) => void;
  setBedrooms: (bedrooms: number | null) => void;
  setBathrooms: (bathrooms: number | null) => void;
  setAreaRange: (minArea: number | null, maxArea: number | null) => void;
  toggleAmenity: (amenity: string) => void;
  setViewMode: (viewMode: ListingViewMode) => void;
  resetFilters: () => void;
};

const initialFilters = {
  location: "",
  propertyType: "" as PropertyType,
  transactionType: "" as TransactionType,
  minPrice: null,
  maxPrice: null,
  bedrooms: null,
  bathrooms: null,
  minArea: null,
  maxArea: null,
  amenities: [] as string[],
};

export const useListingFilterStore = create<ListingFilterState>((set) => ({
  ...initialFilters,
  viewMode: "grid",

  setLocation: (location) => set({ location }),
  setPropertyType: (propertyType) => set({ propertyType }),
  setTransactionType: (transactionType) => set({ transactionType }),
  setPriceRange: (minPrice, maxPrice) => set({ minPrice, maxPrice }),
  setBedrooms: (bedrooms) => set({ bedrooms }),
  setBathrooms: (bathrooms) => set({ bathrooms }),
  setAreaRange: (minArea, maxArea) => set({ minArea, maxArea }),
  setViewMode: (viewMode) => set({ viewMode }),

  toggleAmenity: (amenity) =>
    set((state) => ({
      amenities: state.amenities.includes(amenity)
        ? state.amenities.filter((item) => item !== amenity)
        : [...state.amenities, amenity],
    })),

  resetFilters: () => set({ ...initialFilters }),
}));
