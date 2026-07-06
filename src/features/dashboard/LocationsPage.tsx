"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MapPin,
  Flame,
  Percent,
  UsersRound,
  CircleDollarSign,
  Pencil,
  Trash2,
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  Navigation,
  Map,
  PieChart,
  Send,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { PropertyLocationMap } from "@/components/maps/PropertyLocationMap";
import { useDashboardLocationsQuery } from "@/hooks/queries/useDashboardLocationsQuery";
import {
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} from "@/hooks/mutations/useLocationMutations";
import type { LocationDto } from "@/features/locations/types/location-dto";
import { DISTRIBUTION_CONFIG, ACTIVITY_KIND_CONFIG } from "./locations-data";
import {
  EditLocationModal,
  type LocationFormValues,
} from "./components/EditLocationModal";

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

const PIN_COLORS = [
  { bg: "#e0e7ff", color: "#6366f1" },
  { bg: "#d1fae5", color: "#10b981" },
  { bg: "#ffedd5", color: "#f59e0b" },
  { bg: "#fee2e2", color: "#ef4444" },
  { bg: "#dbeafe", color: "#1e4f86" },
];

function formatRevenue(value: number) {
  return `$${value.toFixed(2)}M`;
}

function formatPriceM2(value: number) {
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: string | number;
  iconBg: string;
  icon: React.ReactNode;
};

function StatCard({ label, value, iconBg, icon }: StatCardProps) {
  return (
    <div className="min-w-0 bg-white border border-[#e5e7eb] rounded-[14px] p-4 flex flex-col gap-[18px] h-[112px]">
      <div className="flex items-center justify-between">
        <p className="text-[14px] text-[#6a7282]" style={mont}>
          {label}
        </p>
        <span
          className="size-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </span>
      </div>
      <p
        className="text-[24px] font-semibold text-[#1e4f86] leading-[28px]"
        style={poppins}
      >
        {value}
      </p>
    </div>
  );
}

// ── Location list card ───────────────────────────────────────────────────────

type LocationListCardProps = {
  location: LocationDto;
  isSelected: boolean;
  pinColors: { bg: string; color: string };
  onSelect: () => void;
};

function LocationListCard({
  location,
  isSelected,
  pinColors,
  onSelect,
}: LocationListCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left px-4 py-4 border-b border-[#f0f0f0] transition-colors ${
        isSelected ? "bg-[#eff6ff]" : "bg-white hover:bg-[#fafbfc]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className="size-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ backgroundColor: pinColors.bg }}
          >
            <MapPin size={18} style={{ color: pinColors.color }} />
          </span>
          <div className="flex flex-col">
            <p
              className="text-[14px] font-semibold text-[#0d2138]"
              style={mont}
            >
              {location.name}
            </p>
            <p className="text-[12px] text-[#6a7282]" style={mont}>
              {location.region}
            </p>
          </div>
        </div>
        <span
          className="h-[22px] px-2.5 rounded-full bg-[#d1fae5] flex items-center gap-0.5 text-[11px] font-semibold text-[#10b981] shrink-0"
          style={mont}
        >
          <ArrowUpRight size={11} strokeWidth={2.25} />
          {location.growthPercent}%
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="border border-[#e5e7eb] rounded-[10px] py-2 flex flex-col items-center">
          <p className="text-[15px] font-bold text-[#0d2138]" style={poppins}>
            {location.properties}
          </p>
          <p className="text-[11px] text-[#6a7282]" style={mont}>
            Properties
          </p>
        </div>
        <div className="bg-[#f9fafb] rounded-[10px] py-2 flex flex-col items-center">
          <p className="text-[15px] font-bold text-[#10b981]" style={poppins}>
            {location.active}
          </p>
          <p className="text-[11px] text-[#6a7282]" style={mont}>
            Active
          </p>
        </div>
        <div className="bg-[#f9fafb] rounded-[10px] py-2 flex flex-col items-center">
          <p className="text-[15px] font-bold text-[#10b981]" style={poppins}>
            {location.sold}
          </p>
          <p className="text-[11px] text-[#6a7282]" style={mont}>
            Sold
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px]" style={mont}>
          <span className="font-semibold text-[#1f2937]">
            {formatRevenue(location.revenue)}
          </span>
          <span className="text-[#6b7280]"> revenue</span>
        </p>
        <p className="text-[12px] text-[#6b7280]" style={mont}>
          {location.agents} agents
        </p>
      </div>
    </button>
  );
}

// ── Bottom stat card ─────────────────────────────────────────────────────────

type BottomStatCardProps = {
  label: string;
  icon: React.ReactNode;
  value: string;
  valueColor?: string;
  children?: React.ReactNode;
};

function BottomStatCard({
  label,
  icon,
  value,
  valueColor = "#1E4F86",
  children,
}: BottomStatCardProps) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-[12px] text-[#6a7282]" style={mont}>
          {label}
        </p>
      </div>
      <p
        className="text-[22px] font-bold"
        style={{
          ...mont,
          color: valueColor,
        }}
      >
        {value}
      </p>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type LocationsPageProps = {
  role: Role;
};

export function LocationsPage({ role }: LocationsPageProps) {
  const { data, isLoading, isError } = useDashboardLocationsQuery();
  const createMutation = useCreateLocationMutation();
  const updateMutation = useUpdateLocationMutation();
  const deleteMutation = useDeleteLocationMutation();

  const locations = data?.locations ?? [];

  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);

  const canManage = hasPermission(role, "locations:manage");

  const filtered = locations.filter((loc) =>
    `${loc.name} ${loc.region}`.toLowerCase().includes(search.toLowerCase()),
  );
  const selected =
    locations.find((loc) => loc.id === selectedId) ?? locations[0] ?? null;

  const totalProperties = locations.reduce(
    (sum, loc) => sum + loc.properties,
    0,
  );
  const totalRevenue = locations.reduce((sum, loc) => sum + loc.revenue, 0);
  const totalAgents = locations.reduce((sum, loc) => sum + loc.agents, 0);

  const distributionTotal = selected
    ? selected.distribution.houses +
      selected.distribution.apartments +
      selected.distribution.lots +
      selected.distribution.commercial
    : 0;

  async function handleAddLocation(values: LocationFormValues) {
    try {
      const result = await createMutation.mutateAsync(values);
      setSelectedId(result.location.id);
      setModalMode(null);
      toast.success("Location added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add location");
    }
  }

  async function handleEditLocation(values: LocationFormValues) {
    if (!selected) return;
    try {
      await updateMutation.mutateAsync({ id: selected.id, body: values });
      setModalMode(null);
      toast.success("Location updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update location");
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete ${selected.name}? This action cannot be undone.`)
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(selected.id);
      setSelectedId("");
      toast.success("Location deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete location");
    }
  }

  return (
    <div className="min-w-0 overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h1
            className="text-[20px] font-medium text-[#0d2138] leading-[32px]"
            style={poppins}
          >
            Property Locations
          </h1>
          <p className="text-[14px] font-medium text-[#6a7282]" style={mont}>
            Manage properties across multiple locations
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setModalMode("add")}
            className="w-full sm:w-auto justify-center flex items-center gap-2 h-10 px-4 bg-[#1e4f86] text-white rounded-[10px] text-[14px] font-medium hover:bg-[#1b487a] transition-colors"
            style={mont}
          >
            <Plus size={16} />
            Add New Location
          </button>
        )}
      </div>

      {isLoading ? (
        <div
          className="flex min-h-[220px] items-center justify-center gap-2 rounded-[14px] border border-[#e5e7eb] bg-white px-4 py-16 text-[14px] text-[#6a7282]"
          style={mont}
        >
          <Loader2 size={18} className="animate-spin" />
          Loading locations...
        </div>
      ) : isError ? (
        <div
          role="alert"
          className="flex min-h-[220px] items-center justify-center rounded-[14px] border border-[#fecaca] bg-white px-4 py-16 text-center text-[14px] text-[#e7000b]"
          style={mont}
        >
          Failed to load locations. Please refresh the page.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              label="Active Locations"
              value={locations.length}
              iconBg="#e0e7ff"
              icon={<UsersRound size={18} className="text-[#6366f1]" />}
            />
            <StatCard
              label="Total Properties"
              value={totalProperties}
              iconBg="#fee2e2"
              icon={<Flame size={18} className="text-[#ef4444]" />}
            />
            <StatCard
              label="Total Revenue"
              value={`$${totalRevenue.toFixed(1)}M`}
              iconBg="#d1fae5"
              icon={<Percent size={18} className="text-[#10b981]" />}
            />
            <StatCard
              label="Active Agents"
              value={totalAgents}
              iconBg="#fef3c7"
              icon={<CircleDollarSign size={18} className="text-[#f59e0b]" />}
            />
          </div>

          {/* Main content */}
          <div className="flex flex-col lg:flex-row gap-3.5">
            {/* Location list */}
            <div className="w-full lg:w-[320px] xl:w-[380px] lg:shrink-0 bg-white border border-[#e5e7eb] rounded-[14px] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-[#f0f0f0]">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search locations..."
                    className="w-full h-9 pl-9 pr-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] placeholder:text-[#9ca3af] outline-none focus:border-[#1e4f86] transition-colors"
                    style={mont}
                  />
                </div>
              </div>
              <div className="flex flex-col overflow-y-auto max-h-[520px] lg:max-h-[820px]">
                {filtered.map((location, index) => (
                  <LocationListCard
                    key={location.id}
                    location={location}
                    isSelected={location.id === selected?.id}
                    pinColors={PIN_COLORS[index % PIN_COLORS.length]}
                    onSelect={() => setSelectedId(location.id)}
                  />
                ))}
                {filtered.length === 0 && (
                  <p
                    className="px-4 py-6 text-center text-[12px] text-[#6a7282]"
                    style={mont}
                  >
                    No locations found.
                  </p>
                )}
              </div>
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="flex-1 flex flex-col gap-3.5 min-w-0">
                {/* Location header */}
                <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-5 flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex items-center gap-3.5">
                    <span className="size-[44px] rounded-[14px] flex items-center justify-center shrink-0 bg-[#e0e7ff]">
                      <MapPin size={22} className="text-[#6366f1]" />
                    </span>
                    <div className="min-w-0 flex flex-col gap-1">
                      <p
                        className="text-[16px] font-semibold text-[#0d2138]"
                        style={mont}
                      >
                        {selected.name}
                      </p>
                      <p
                        className="min-w-0 text-[12px] text-[#6a7282] flex items-start gap-1.5"
                        style={mont}
                      >
                        <Navigation size={12} className="mt-0.5 shrink-0" />
                        <span className="break-words">{selected.address}</span>
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span
                          className="h-[22px] px-2.5 rounded-full bg-[#f3f4f6] flex items-center text-[11px] font-medium text-[#6b7280]"
                          style={mont}
                        >
                          {selected.region}
                        </span>
                        <span
                          className="h-[22px] px-2.5 rounded-full bg-[#f3f4f6] flex items-center text-[11px] font-medium text-[#6b7280]"
                          style={mont}
                        >
                          {selected.postalCode}
                        </span>
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="w-full sm:w-auto flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setModalMode("edit")}
                        className="h-9 px-3.5 flex items-center gap-1.5 border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] hover:bg-[#f3f4f6] transition-colors"
                        style={mont}
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${selected.name}`}
                        onClick={handleDelete}
                        className="size-9 flex items-center justify-center border border-[#fca5a5] rounded-[10px] text-[#ef4444] hover:bg-[#fee2e2] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Map + Property Distribution */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                  {/* Map */}
                  <div className="overflow-hidden rounded-[24px] border border-[#dfe3e8] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                    {/* Header */}
                    <div className="flex h-[76px] items-center border-b border-[#e5e7eb] px-7">
                      <Map
                        size={25}
                        strokeWidth={1.8}
                        className="shrink-0 text-[#1e5b96]"
                      />

                      <p
                        className="ml-3 text-[16px] font-semibold text-[#10233f]"
                        style={mont}
                      >
                        Location Map
                      </p>

                      <Send
                        size={23}
                        strokeWidth={1.7}
                        className="ml-auto text-[#6a7282]"
                      />
                    </div>

                    {/* Map */}
                    <div className="relative h-[420px] w-full overflow-hidden bg-[#e8efe7]">
                      {selected.coordinates.lat !== 0 || selected.coordinates.lng !== 0 ? (
                        <PropertyLocationMap
                          latitude={selected.coordinates.lat}
                          longitude={selected.coordinates.lng}
                          title={selected.name}
                          zoom={14}
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-[14px] text-[#6a7282]"
                          style={mont}
                        >
                          No coordinates yet for this location.
                        </div>
                      )}

                      {/* Coordinates */}
                      <div
                        className="pointer-events-none absolute bottom-5 left-5 rounded-[16px] border border-[#e5e7eb] bg-white px-5 py-3 text-[11px] font-medium text-[#6a7282] shadow-[0_2px_8px_rgba(15,23,42,0.18)]"
                        style={mont}
                      >
                        {selected.coordinates.lat.toFixed(4)},{" "}
                        {selected.coordinates.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  {/* Property Distribution */}
                  <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-4 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <PieChart size={16} className="text-[#0d2138]" />
                      <p
                        className="text-[14px] font-semibold text-[#0d2138]"
                        style={mont}
                      >
                        Property Distribution
                      </p>
                    </div>
                    <div className="flex flex-col gap-4">
                      {DISTRIBUTION_CONFIG.map((item) => {
                        const count = selected.distribution[item.key];
                        const percent =
                          distributionTotal > 0
                            ? Math.round((count / distributionTotal) * 100)
                            : 0;
                        const Icon = item.icon;
                        return (
                          <div key={item.key} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="size-7 rounded-[10px] flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: item.iconBg }}
                                >
                                  <Icon
                                    size={14}
                                    style={{ color: item.iconColor }}
                                  />
                                </span>
                                <p
                                  className="text-[13px] font-medium text-[#1f2937]"
                                  style={mont}
                                >
                                  {item.label}
                                </p>
                              </div>
                              <p className="text-[13px]" style={mont}>
                                <span className="font-bold text-[#1f2937]">
                                  {count}
                                </span>
                                <span className="text-[#9ca3af]">
                                  {" "}
                                  ({percent}%)
                                </span>
                              </p>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#f3f4f6]">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${percent}%`,
                                  backgroundColor: item.barColor,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                  <BottomStatCard
                    label="Total Properties"
                    icon={<Building2 size={14} className="text-[#6a7282]" />}
                    value={String(selected.properties)}
                    valueColor="#1E4F86"
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="h-1.5 w-full rounded-full bg-[#f3f4f6]">
                        <div
                          className="h-1.5 rounded-full bg-[#6366f1]"
                          style={{
                            width: `${selected.properties > 0 ? (selected.active / selected.properties) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-[#6a7282]" style={mont}>
                        {selected.active} active
                      </p>
                    </div>
                  </BottomStatCard>
                  <BottomStatCard
                    label="Revenue"
                    icon={<DollarSign size={14} className="text-[#6a7282]" />}
                    value={formatRevenue(selected.revenue)}
                    valueColor="#4896B6"
                  >
                    <p className="text-[11px] text-[#10b981]" style={mont}>
                      ↑ +{selected.growthPercent}% from last month
                    </p>
                  </BottomStatCard>
                  <BottomStatCard
                    label="Avg. Price per m²"
                    icon={<TrendingUp size={14} className="text-[#6a7282]" />}
                    value={formatPriceM2(selected.avgPricePerM2)}
                    valueColor="#1E4F86"
                  >
                    <p className="text-[11px] text-[#6a7282]" style={mont}>
                      Per property
                    </p>
                  </BottomStatCard>
                  <BottomStatCard
                    label="Active Agents"
                    icon={<UsersRound size={14} className="text-[#6a7282]" />}
                    value={String(selected.agents)}
                    valueColor="#1E4F86"
                  >
                    <p className="text-[11px] text-[#6a7282]" style={mont}>
                      Team members
                    </p>
                  </BottomStatCard>
                </div>

                {/* Recent Activity */}
                <div className="bg-white border border-[#e5e7eb] rounded-[14px] p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-[#0d2138]" />
                    <p
                      className="text-[14px] font-semibold text-[#0d2138]"
                      style={mont}
                    >
                      Recent Activity
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {selected.activity.length === 0 && (
                      <p className="text-[12px] text-[#6a7282]" style={mont}>
                        No recent activity for this location.
                      </p>
                    )}
                    {selected.activity.map((item) => {
                      const config = ACTIVITY_KIND_CONFIG[item.kind];
                      const Icon = config.icon;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3"
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className="size-7 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
                              style={{ backgroundColor: config.iconBg }}
                            >
                              <Icon size={14} style={{ color: config.iconColor }} />
                            </span>
                            <div className="flex flex-col">
                              <p
                                className="text-[13px] font-medium text-[#1f2937]"
                                style={mont}
                              >
                                {item.description}
                              </p>
                            </div>
                          </div>
                          <p
                            className="self-end sm:self-auto text-[11px] text-[#9ca3af] whitespace-nowrap shrink-0"
                            style={mont}
                          >
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {modalMode === "add" && (
        <EditLocationModal
          onClose={() => setModalMode(null)}
          onSubmit={handleAddLocation}
          isSubmitting={createMutation.isPending}
        />
      )}
      {modalMode === "edit" && selected && (
        <EditLocationModal
          location={selected}
          onClose={() => setModalMode(null)}
          onSubmit={handleEditLocation}
          isSubmitting={updateMutation.isPending}
        />
      )}
    </div>
  );
}
