"use client";

import { useRef, useState } from "react";
import {
  X,
  ChevronDown,
  Upload,
  SquareParking,
  Trees,
  Waves,
  Dumbbell,
  Building2,
  ArrowUpDown,
  ShieldCheck,
  Sofa,
  PawPrint,
} from "lucide-react";

import type { ListingType, ListingStatus, OperationType } from "../listings-data";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type NewListing = {
  name: string;
  type: ListingType;
  status: ListingStatus;
  operation: OperationType;
  salePrice: string;
  rentPrice: string;
  location: string;
  address: string;
  featured: boolean;
  bedrooms: string;
  bathrooms: string;
  area: string;
  yearBuilt: string;
  toilettes: string;
  description: string;
  features: string[];
  images: string[];
};

type UploadListingModalProps = {
  onClose: () => void;
  onCreate?: (listing: NewListing) => void;
};

const STEPS = ["Basic Info", "Listing Details", "Images"] as const;

const AMENITIES: { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { label: "Parking", icon: SquareParking },
  { label: "Garden", icon: Trees },
  { label: "Pool", icon: Waves },
  { label: "Gym", icon: Dumbbell },
  { label: "Balcony", icon: Building2 },
  { label: "Elevator", icon: ArrowUpDown },
  { label: "Security", icon: ShieldCheck },
  { label: "Furnished", icon: Sofa },
  { label: "Pet Friendly", icon: PawPrint },
];

const inputClass =
  "h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#1e4f86]" : "bg-[#d1d5db]"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${checked ? "translate-x-[22px]" : "translate-x-0.5"}`} />
    </button>
  );
}

export function UploadListingModal({ onClose, onCreate }: UploadListingModalProps) {
  const [step, setStep] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 1
  const [name, setName] = useState("");
  const [type, setType] = useState<ListingType>("Apartment");
  const [status, setStatus] = useState<ListingStatus>("Active");
  const [operations, setOperations] = useState<("Sale" | "Rent")[]>(["Sale"]);
  const [salePrice, setSalePrice] = useState("450000");
  const [rentPrice, setRentPrice] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [featured, setFeatured] = useState(true);

  // Step 2
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [area, setArea] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");
  const [toilettes, setToilettes] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>(["Parking"]);

  // Step 3
  const [images, setImages] = useState<string[]>([]);

  const hasSale = operations.includes("Sale");
  const hasRent = operations.includes("Rent");

  function toggleOperation(op: "Sale" | "Rent") {
    setOperations((prev) => {
      const next = prev.includes(op) ? prev.filter((o) => o !== op) : [...prev, op];
      return next.length === 0 ? [op] : next; // keep at least one selected
    });
  }

  function toggleFeature(label: string) {
    setFeatures((prev) => (prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setImages((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  }

  function handleSubmit() {
    const operation: OperationType = hasSale && hasRent ? "Both" : hasRent ? "Rent" : "Sale";
    onCreate?.({
      name: name.trim(), type, status, operation, salePrice, rentPrice,
      location: location.trim(), address: address.trim(), featured,
      bedrooms, bathrooms, area, yearBuilt, toilettes, description: description.trim(),
      features, images,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[14px] w-full max-w-[850px] max-h-[92vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 pt-5 pb-5 border-b border-[#e5e7eb]">
          <div className="flex flex-col">
            <p className="text-[16px] font-semibold text-[#0d2138] leading-6" style={mont}>Upload New Listing</p>
            <p className="text-[12px] text-[#6a7282] mt-0.5" style={mont}>Step {step + 1} of {STEPS.length}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-5 grid grid-cols-3 gap-3">
          {STEPS.map((label, i) => (
            <div key={label} className="flex flex-col gap-2">
              <div className={`h-1 rounded-full ${i <= step ? "bg-[#1e4f86]" : "bg-[#e5e7eb]"}`} />
              <span className={`text-[12px] font-medium ${i <= step ? "text-[#1e4f86]" : "text-[#6a7282]"}`} style={mont}>{label}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-6 flex flex-col gap-5">
          {/* ── Step 1: Basic Info ── */}
          {step === 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={mont}>Listing Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Modern Downtown Apartment" className={inputClass} style={mont} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Listing Type *</label>
                  <div className="relative">
                    <select value={type} onChange={(e) => setType(e.target.value as ListingType)} className="w-full h-10 pl-3 pr-9 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer" style={mont}>
                      <option>Apartment</option><option>House</option><option>Commercial</option><option>Land</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Status *</label>
                  <div className="relative">
                    <select value={status} onChange={(e) => setStatus(e.target.value as ListingStatus)} className="w-full h-10 pl-3 pr-9 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer" style={mont}>
                      <option>Active</option><option>Paused</option><option>Rented</option><option>Sold</option>
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Operation Type */}
              <div className="flex flex-col gap-2">
                <label className={labelClass} style={mont}>Operation Type</label>
                <div className="flex items-center gap-3">
                  {(["Sale", "Rent"] as const).map((op) => {
                    const active = operations.includes(op);
                    return (
                      <button
                        key={op}
                        type="button"
                        onClick={() => toggleOperation(op)}
                        className={`h-9 px-5 rounded-[8px] border text-[12px] font-medium transition-colors ${
                          active ? "bg-[#1e4f86] border-[#1e4f86] text-white" : "bg-white border-[#e5e7eb] text-[#1f2937] hover:bg-[#f9fafb]"
                        }`}
                        style={mont}
                      >
                        {op}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price(s) */}
              <div className={hasSale && hasRent ? "grid grid-cols-2 gap-5" : ""}>
                {hasSale && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Sale Price *</label>
                    <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="450000" className={inputClass} style={mont} />
                  </div>
                )}
                {hasRent && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Rent Price *</label>
                    <input type="number" value={rentPrice} onChange={(e) => setRentPrice(e.target.value)} placeholder="450000" className={inputClass} style={mont} />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={mont}>Location *</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Buenos Aires, Argentina" className={inputClass} style={mont} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={mont}>Full Address *</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="1234 Main Street, Downtown" className={inputClass} style={mont} />
              </div>

              {/* Featured toggle */}
              <div className="flex items-center justify-between gap-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] px-4 py-3.5">
                <div className="flex flex-col">
                  <p className="text-[14px] font-medium text-[#1f2937]" style={mont}>Featured listing</p>
                  <p className="text-[12px] text-[#6a7282]" style={mont}>Highlight this property at the top of listings</p>
                </div>
                <Toggle checked={featured} onChange={setFeatured} />
              </div>
            </>
          )}

          {/* ── Step 2: Listing Details ── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-3 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Bedrooms *</label>
                  <input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="3" className={inputClass} style={mont} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Bathrooms *</label>
                  <input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="2" className={inputClass} style={mont} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Area (sqft) *</label>
                  <input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="1200" className={inputClass} style={mont} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Year Built *</label>
                  <input type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="2020" className={inputClass} style={mont} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Toilettes *</label>
                  <input type="number" value={toilettes} onChange={(e) => setToilettes(e.target.value)} placeholder="2" className={inputClass} style={mont} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={mont}>Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the listing, its features, and unique selling points..." rows={4} className="px-3.5 py-2.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none" style={mont} />
              </div>
              <div className="flex flex-col gap-3">
                <label className={labelClass} style={mont}>Features &amp; Amenities</label>
                <div className="grid grid-cols-3 gap-3">
                  {AMENITIES.map(({ label, icon: Icon }) => {
                    const active = features.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleFeature(label)}
                        className={`flex items-center gap-2.5 h-11 px-4 rounded-[10px] border text-[12px] transition-colors ${
                          active ? "bg-white border-[#1e4f86] text-[#1e4f86] font-medium" : "bg-[#fafbfc] border-[#e5e7eb] text-[#6a7282] hover:bg-[#f3f4f6]"
                        }`}
                        style={mont}
                      >
                        <Icon size={16} className={active ? "text-[#1e4f86]" : "text-[#99a1af]"} />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Images ── */}
          {step === 2 && (
            <>
              <div className="flex flex-col gap-2">
                <label className={labelClass} style={mont}>Listing Images *</label>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#e5e7eb] rounded-[10px] bg-[#fafbfc] hover:bg-[#f3f4f6] transition-colors flex flex-col items-center justify-center gap-3 py-10 text-center"
                >
                  <span className="size-12 rounded-full bg-[#e0e7ff] flex items-center justify-center">
                    <Upload size={22} className="text-[#1e4f86]" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-[14px] font-medium text-[#0d2138]" style={mont}>Upload Listing Images</p>
                    <p className="text-[12px] text-[#6a7282]" style={mont}>Drag and drop your images here, or click to browse</p>
                  </div>
                  <span className="h-9 px-4 bg-[#1e4f86] rounded-[8px] flex items-center text-[12px] font-medium text-white" style={mont}>Choose Files</span>
                  <p className="text-[11px] text-[#9ca3af]" style={mont}>Supported formats: JPG, PNG, WebP (Max 10MB each)</p>
                </button>
              </div>

              {images.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-[12px] font-medium text-[#1f2937]" style={mont}>Uploaded Images ({images.length})</p>
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-[10px] overflow-hidden border border-[#e5e7eb]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Upload ${i + 1}`} className="size-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[6px] bg-[#1e4f86] text-white text-[10px] font-medium" style={mont}>Cover</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white flex items-center justify-between gap-3 px-6 py-4 border-t border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => s - 1)} className="h-10 px-4 border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors" style={mont}>
                Previous
              </button>
            )}
            <button type="button" onClick={onClose} className="h-10 px-4 border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-white hover:bg-[#f3f4f6] transition-colors" style={mont}>
              Cancel
            </button>
          </div>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="h-10 px-5 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors" style={mont}>
              Next Step
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} className="h-10 px-6 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors" style={mont}>
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
