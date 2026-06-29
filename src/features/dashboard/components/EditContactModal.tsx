"use client";

import { useState } from "react";
import { X, Home, Trash2 } from "lucide-react";

import type { ContactDto } from "@/features/crm/types/crm-dto";
import { ContactType } from "@/generated/prisma/enums";
import { ListingPicker } from "./ListingPicker";
import { SearchableSelect } from "./SearchableSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const CONTACT_TYPE_OPTIONS = [
  { value: ContactType.BUYER, label: "Buyer" },
  { value: ContactType.SELLER, label: "Seller" },
  { value: ContactType.BOTH, label: "Both" },
];

export type EditContactInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: ContactType;
  location: string;
  address: string;
  notes: string;
  propertyIds: string[];
};

type EditContactModalProps = {
  contact: ContactDto;
  onClose: () => void;
  onSave: (id: string, input: EditContactInput) => void;
  isSaving?: boolean;
};

const inputClass =
  "h-[37.5px] px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

type PropertyRow = { id: string; label: string };

export function EditContactModal({ contact, onClose, onSave, isSaving }: EditContactModalProps) {
  const [firstName, setFirstName] = useState(contact.firstName);
  const [lastName, setLastName] = useState(contact.lastName);
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [type, setType] = useState<ContactType>(contact.type);
  const [location, setLocation] = useState(contact.location ?? "");
  const [address, setAddress] = useState(contact.address ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [propertyRows, setPropertyRows] = useState<PropertyRow[]>(
    contact.properties
      .filter((p) => p.role === "OWNER")
      .map((p) => ({ id: p.id, label: `${p.listingId} — ${p.title}` })),
  );

  const isSellerType = type === ContactType.SELLER || type === ContactType.BOTH;

  function updatePropertyRow(index: number, id: string, label: string) {
    setPropertyRows((prev) => prev.map((p, i) => (i === index ? { id, label } : p)));
  }

  function addPropertyRow() {
    setPropertyRows((prev) => [...prev, { id: "", label: "" }]);
  }

  function removePropertyRow(index: number) {
    setPropertyRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(contact.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      type,
      location: location.trim(),
      address: address.trim(),
      notes: notes.trim(),
      propertyIds: isSellerType ? propertyRows.map((p) => p.id).filter(Boolean) : [],
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-[16px] w-full max-w-[700px] max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-[25px] border-b border-[#e5e7eb]">
          <div className="flex flex-col">
            <p className="text-[16px] font-semibold text-[#0d2138] leading-6" style={mont}>Edit Contact</p>
            <p className="text-[12px] text-[#6a7282] mt-0.5" style={mont}>
              {contact.contactId} · Update contact information
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-5">
          {/* First / Last name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>First Name *</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                className={inputClass}
                style={mont}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Last Name *</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                className={inputClass}
                style={mont}
              />
            </div>
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@email.com"
                className={inputClass}
                style={mont}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                className={inputClass}
                style={mont}
              />
            </div>
          </div>
          {!email.trim() && !phone.trim() && (
            <p className="-mt-3 text-[12px] text-[#b45309]" style={mont}>Provide at least an email or a phone number.</p>
          )}

          {/* Contact Type / Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Contact Type *</label>
              <SearchableSelect
                size="sm"
                searchable={false}
                value={type}
                onChange={(next) => setType(next as ContactType)}
                options={CONTACT_TYPE_OPTIONS}
                placeholder="Select type"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Province"
                className={inputClass}
                style={mont}
              />
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#1f2937]" style={mont}>Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
              className={inputClass}
              style={mont}
            />
          </div>

          {/* Property Listings — sellers only */}
          {isSellerType && (
            <div className="flex flex-col gap-3 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2">
                <Home size={15} className="shrink-0 text-[#1a5ea8]" />
                <p className="text-[12px] font-medium text-[#1a5ea8]" style={mont}>Property Listings</p>
              </div>
              <p className="text-[12px] leading-5 text-[#6a7282]" style={mont}>
                Listings this seller owns. Changes are saved when you click Save Changes.
              </p>

              {propertyRows.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {propertyRows.map((row, index) => (
                    <div key={index} className="flex items-center gap-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[11px] font-semibold text-white" style={mont}>
                        {index + 1}
                      </span>
                      <ListingPicker
                        className="min-w-0 flex-1"
                        value={row.id}
                        label={row.label}
                        onSelect={(id, label) => updatePropertyRow(index, id, label)}
                        excludeIds={propertyRows
                          .filter((_, i) => i !== index)
                          .map((p) => p.id)
                          .filter(Boolean)}
                      />
                      <button
                        type="button"
                        onClick={() => removePropertyRow(index)}
                        title="Remove property"
                        aria-label="Remove property"
                        className="flex size-9 shrink-0 items-center justify-center text-[#6a7282] transition-colors hover:text-[#fb2c36]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={addPropertyRow}
                className="flex h-9 w-full items-center justify-center rounded-[8px] border-[1.5px] border-[#1a5ea8] px-4 text-[12px] font-medium text-[#1e4f86] transition-colors hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-start"
                style={mont}
              >
                Add Property
              </button>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#1f2937]" style={mont}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this contact..."
              rows={3}
              className="px-3 py-2 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none"
              style={mont}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[41.5px] border border-[#e5e7eb] rounded-[10px] text-[12px] font-medium text-[#6b7280] bg-[#f8fafc] hover:bg-[#f3f4f6] transition-colors"
              style={mont}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || (!email.trim() && !phone.trim())}
              className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={mont}
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
