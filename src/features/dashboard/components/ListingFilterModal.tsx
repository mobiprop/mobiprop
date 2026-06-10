"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type ListingFilterValues = {
  operationTypes: string[];
  propertyTypes: string[];
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  statuses: string[];
};

const OPERATION_TYPES = ["Sale", "Rent", "Both"];
const PROPERTY_TYPES = ["Apartment", "House", "Commercial", "Land"];
const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];
const STATUSES = ["Active", "Paused", "Rented", "Sold"];

type ListingFilterModalProps = {
  resultCount: number;
  onApply: (filters: ListingFilterValues) => void;
  onClose: () => void;
};

function CheckboxRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-2.5" style={mont}>
      <span
        className={`size-[18px] rounded-[5px] border flex items-center justify-center transition-colors ${
          checked ? "bg-[#1e4f86] border-[#1e4f86]" : "bg-white border-[#d0d0d0]"
        }`}
      >
        {checked && <Check size={12} className="text-white" />}
      </span>
      <span className="text-[14px] text-[#2a2a2a]">{label}</span>
    </button>
  );
}

export function ListingFilterModal({ resultCount, onApply, onClose }: ListingFilterModalProps) {
  const [operationTypes, setOperationTypes] = useState<string[]>(["Sale"]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("Any");
  const [statuses, setStatuses] = useState<string[]>([]);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function clearAll() {
    setOperationTypes([]);
    setPropertyTypes([]);
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("Any");
    setStatuses([]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[16px] w-full max-w-[460px] max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0]">
          <p className="text-[16px] font-semibold text-[#1a1a1a]" style={mont}>Filter Listings</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={clearAll} className="text-[12px] font-medium text-[#185fa5] hover:underline" style={mont}>
              Clear all
            </button>
            <button type="button" onClick={onClose} className="text-[#6a7282] hover:text-[#0d2138] transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Operation type */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Operation Type</p>
            <div className="grid grid-cols-3 gap-2">
              {OPERATION_TYPES.map((t) => (
                <CheckboxRow key={t} label={t} checked={operationTypes.includes(t)} onToggle={() => toggle(operationTypes, t, setOperationTypes)} />
              ))}
            </div>
          </div>

          {/* Property type */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Property Type</p>
            <div className="grid grid-cols-4 gap-2">
              {PROPERTY_TYPES.map((t) => (
                <CheckboxRow key={t} label={t} checked={propertyTypes.includes(t)} onToggle={() => toggle(propertyTypes, t, setPropertyTypes)} />
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Price Range</p>
            <div className="flex items-center gap-3">
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min $"
                inputMode="numeric"
                className="flex-1 h-10 px-3 border border-[#d0d0d0] rounded-[10px] text-[12px] text-[#2a2a2a] placeholder:text-[#9a9a9a] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
              <span className="text-[#9a9a9a]">—</span>
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max $"
                inputMode="numeric"
                className="flex-1 h-10 px-3 border border-[#d0d0d0] rounded-[10px] text-[12px] text-[#2a2a2a] placeholder:text-[#9a9a9a] outline-none focus:border-[#1e4f86] transition-colors"
                style={mont}
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Bedrooms</p>
            <div className="flex flex-wrap gap-2.5">
              {BEDROOM_OPTIONS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBedrooms(b)}
                  className={`h-9 min-w-[72px] px-4 rounded-full border text-[12px] transition-colors ${
                    bedrooms === b
                      ? "bg-[#eff6ff] border-[#1e4f86] text-[#1e4f86] font-medium"
                      : "bg-white border-[#d0d0d0] text-[#2a2a2a] hover:bg-[#f8fafc]"
                  }`}
                  style={mont}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-3">
            <p className="text-[12px] text-[#7a7a7a]" style={mont}>Status</p>
            <div className="grid grid-cols-4 gap-2">
              {STATUSES.map((s) => (
                <CheckboxRow key={s} label={s} checked={statuses.includes(s)} onToggle={() => toggle(statuses, s, setStatuses)} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#f0f0f0]">
          <span className="text-[12px] text-[#6b6b6b]" style={mont}>{resultCount} results</span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={clearAll}
              className="h-9 px-4 border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#5a5a5a] bg-white hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => onApply({ operationTypes, propertyTypes, minPrice, maxPrice, bedrooms, statuses })}
              className="h-9 px-5 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
