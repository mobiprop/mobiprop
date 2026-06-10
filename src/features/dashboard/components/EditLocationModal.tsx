"use client";

import { useState } from "react";
import { X } from "lucide-react";

import type { PropertyLocation } from "../locations-data";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type LocationFormValues = {
  name: string;
  region: string;
  address: string;
  postalCode: string;
};

type EditLocationModalProps = {
  location?: PropertyLocation | null;
  onClose: () => void;
  onSubmit: (values: LocationFormValues) => void;
};

const inputClass =
  "h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] text-[#1f2937]";

export function EditLocationModal({ location, onClose, onSubmit }: EditLocationModalProps) {
  const [name, setName] = useState(location?.name ?? "");
  const [region, setRegion] = useState(location?.region ?? "");
  const [address, setAddress] = useState(location?.address ?? "");
  const [postalCode, setPostalCode] = useState(location?.postalCode ?? "");

  const isEdit = Boolean(location);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ name: name.trim(), region: region.trim(), address: address.trim(), postalCode: postalCode.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[14px] w-full max-w-[520px] max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-5 pt-5 pb-[21px] border-b border-[#e5e7eb]">
          <div className="flex flex-col">
            <p className="text-[16px] font-semibold text-[#1f2937] leading-6" style={mont}>
              {isEdit ? "Edit Location" : "Add New Location"}
            </p>
            <p className="text-[12px] text-[#6a7282] mt-0.5" style={mont}>
              {isEdit ? "Update this location's details" : "Add a new property location"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Location Name *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Buenos Aires"
              className={inputClass}
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Region / Province *</label>
            <input
              required
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g., Buenos Aires"
              className={inputClass}
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Address *</label>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., Av. Corrientes 1234, C1043 CABA"
              className={inputClass}
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass} style={mont}>Postal Code *</label>
            <input
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g., C1043"
              className={inputClass}
              style={mont}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-[39.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              {isEdit ? "Save Changes" : "Add Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
