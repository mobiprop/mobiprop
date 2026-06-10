"use client";

import { useState } from "react";
import { Building2, Home, Building, Map, Store } from "lucide-react";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type ContractFilters = {
  location: string;
  transactionTypes: string[];
  listingTypes: string[];
};

const TRANSACTION_TYPES = ["Sale", "Rental"] as const;

const LISTING_TYPES: { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { label: "Apartment", icon: Building2 },
  { label: "House", icon: Home },
  { label: "Townhouse", icon: Building },
  { label: "Land", icon: Map },
  { label: "Commercial Office", icon: Store },
];

type ContractFilterPopoverProps = {
  resultCount: number;
  onApply: (filters: ContractFilters) => void;
  onClose: () => void;
};

function Pill({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 h-7 px-3.5 rounded-full border-[0.5px] text-[12px] transition-colors ${
        active
          ? "bg-[#eff6ff] border-[#1e4f86] text-[#1e4f86]"
          : "bg-white border-[#d0d0d0] text-[#2a2a2a] hover:bg-[#f8fafc]"
      }`}
      style={mont}
    >
      {Icon && <Icon size={14} className={active ? "text-[#1e4f86]" : "text-[#1e4f86]"} />}
      {label}
    </button>
  );
}

export function ContractFilterPopover({ resultCount, onApply, onClose }: ContractFilterPopoverProps) {
  const [location, setLocation] = useState("");
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [listingTypes, setListingTypes] = useState<string[]>([]);

  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function clearAll() {
    setLocation("");
    setTransactionTypes([]);
    setListingTypes([]);
  }

  return (
    <>
      {/* Click-away backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="absolute right-0 top-[calc(100%+8px)] z-50 w-[520px] bg-white border-[0.5px] border-[#e0e0e0] rounded-[14px] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-[22px] border-b border-[#f0f0f0]">
          <p className="text-[14px] font-medium text-[#1a1a1a]" style={mont}>Filter contracts</p>
          <button
            type="button"
            onClick={clearAll}
            className="text-[12px] font-medium text-[#185fa5] hover:underline"
            style={mont}
          >
            Clear all
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 px-6 pt-5 pb-2">
          {/* Location */}
          <div className="flex flex-col gap-3">
            <label className="text-[12px] text-[#7a7a7a]" style={mont}>Filter by Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter city, state, or ZIP code"
              className="h-[34px] px-3 border-[0.5px] border-[#d0d0d0] rounded-[10px] text-[12px] text-[#2a2a2a] placeholder:text-[#9a9a9a] outline-none focus:border-[#1e4f86] transition-colors"
              style={mont}
            />
          </div>

          {/* Transaction type */}
          <div className="flex flex-col gap-3">
            <label className="text-[12px] text-[#7a7a7a]" style={mont}>By Transaction Type</label>
            <div className="flex flex-wrap gap-2">
              {TRANSACTION_TYPES.map((t) => (
                <Pill
                  key={t}
                  label={t}
                  active={transactionTypes.includes(t)}
                  onClick={() => toggle(transactionTypes, t, setTransactionTypes)}
                />
              ))}
            </div>
          </div>

          {/* Listing type */}
          <div className="flex flex-col gap-3">
            <label className="text-[12px] text-[#7a7a7a]" style={mont}>By Listing Type</label>
            <div className="flex flex-wrap gap-2">
              {LISTING_TYPES.map(({ label, icon }) => (
                <Pill
                  key={label}
                  label={label}
                  icon={icon}
                  active={listingTypes.includes(label)}
                  onClick={() => toggle(listingTypes, label, setListingTypes)}
                />
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
              className="h-9 px-4 text-[12px] text-[#5a5a5a] hover:text-[#1a1a1a] transition-colors"
              style={mont}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => onApply({ location, transactionTypes, listingTypes })}
              className="h-9 px-5 bg-[#185fa5] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#15528f] transition-colors"
              style={mont}
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
