import { create } from "zustand";

type Coordinates = {
  lat: number;
  lng: number;
};

type MapState = {
  isMapOpen: boolean;
  isDrawModeActive: boolean;
  selectedListingId: string | null;
  hoveredListingId: string | null;
  mapCenter: Coordinates;
  mapZoom: number;
  drawnGeometry: unknown | null;

  openMap: () => void;
  closeMap: () => void;
  toggleDrawMode: () => void;
  setSelectedListingId: (id: string | null) => void;
  setHoveredListingId: (id: string | null) => void;
  setMapCenter: (coords: Coordinates) => void;
  setMapZoom: (zoom: number) => void;
  setDrawnGeometry: (geometry: unknown | null) => void;
  clearDrawnGeometry: () => void;
};

export const useMapStore = create<MapState>((set) => ({
  isMapOpen: false,
  isDrawModeActive: false,
  selectedListingId: null,
  hoveredListingId: null,
  // Default center: Buenos Aires, Argentina.
  mapCenter: {
    lat: -34.6037,
    lng: -58.3816,
  },
  mapZoom: 11,
  drawnGeometry: null,

  openMap: () => set({ isMapOpen: true }),
  closeMap: () => set({ isMapOpen: false }),
  toggleDrawMode: () =>
    set((state) => ({ isDrawModeActive: !state.isDrawModeActive })),
  setSelectedListingId: (id) => set({ selectedListingId: id }),
  setHoveredListingId: (id) => set({ hoveredListingId: id }),
  setMapCenter: (coords) => set({ mapCenter: coords }),
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  setDrawnGeometry: (geometry) => set({ drawnGeometry: geometry }),
  clearDrawnGeometry: () => set({ drawnGeometry: null }),
}));
