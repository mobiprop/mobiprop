"use client";

import { useState } from "react";
import { X, ChevronDown, Home, ExternalLink, Trash2 } from "lucide-react";

import type { ContactType } from "../ContactsPage";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type NewContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contactType: ContactType;
  location: string;
  address: string;
  notes: string;
  // Only populated for sellers — properties they own.
  properties?: string[];
};

type AddContactModalProps = {
  onClose: () => void;
  onCreate?: (contact: NewContact) => void;
};

const inputClass =
  "h-[37.5px] px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

export function AddContactModal({ onClose, onCreate }: AddContactModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactType, setContactType] = useState<ContactType>("Buyer");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [properties, setProperties] = useState<string[]>([""]);

  const isSeller = contactType === "Seller";

  function updateProperty(index: number, value: string) {
    setProperties((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  function addProperty() {
    setProperties((prev) => [...prev, ""]);
  }

  function removeProperty(index: number) {
    setProperties((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate?.({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      contactType,
      location: location.trim(),
      address: address.trim(),
      notes: notes.trim(),
      properties: isSeller ? properties.map((p) => p.trim()).filter(Boolean) : undefined,
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
            <p className="text-[16px] font-semibold text-[#0d2138] leading-6" style={mont}>Add New Contact</p>
            <p className="text-[12px] text-[#6a7282] mt-0.5" style={mont}>Add a new client or prospect to your database</p>
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
              <label className={labelClass} style={mont}>Email Address *</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@email.com"
                className={inputClass}
                style={mont}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Phone Number *</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 11 1234-5678"
                className={inputClass}
                style={mont}
              />
            </div>
          </div>

          {/* Contact Type / Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>Contact Type *</label>
              <div className="relative">
                <select
                  required
                  value={contactType}
                  onChange={(e) => setContactType(e.target.value as ContactType)}
                  className="w-full h-[35px] pl-3 pr-8 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#232323] bg-white appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer"
                  style={mont}
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Seller">Seller</option>
                </select>
                <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
              </div>
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
          {isSeller && (
            <div className="bg-[#f8fafc] border border-[#e5e7eb] rounded-[12px] p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Home size={15} className="text-[#1a5ea8]" />
                <p className="text-[12px] font-medium text-[#1a5ea8]" style={mont}>Property Listings</p>
              </div>
              <p className="text-[12px] text-[#6a7282]" style={mont}>
                Add properties this seller owns to identify and link them to this contact.
              </p>

              <div className="flex flex-col gap-2.5">
                {properties.map((property, index) => (
                  <div key={index} className="flex items-center gap-2.5">
                    <span className="size-6 shrink-0 rounded-full bg-[#1e4f86] text-white flex items-center justify-center text-[11px] font-semibold" style={mont}>
                      {index + 1}
                    </span>
                    <input
                      value={property}
                      onChange={(e) => updateProperty(index, e.target.value)}
                      placeholder="Property address or listing ID"
                      className="flex-1 h-9 px-3 bg-white border-[1.5px] border-[#c2dcff] rounded-[8px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
                      style={mont}
                    />
                    <button
                      type="button"
                      className="h-9 px-3 bg-[#1e4f86] rounded-[8px] flex items-center gap-2 text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors shrink-0"
                      style={mont}
                    >
                      <ExternalLink size={12} />
                      View Listing
                    </button>
                    {properties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProperty(index)}
                        title="Remove property"
                        className="size-9 shrink-0 flex items-center justify-center text-[#6a7282] hover:text-[#fb2c36] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addProperty}
                className="self-start h-9 px-4 border-[1.5px] border-[#1a5ea8] rounded-[8px] text-[12px] font-medium text-[#1e4f86] hover:bg-[#eff6ff] transition-colors"
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
              className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors"
              style={mont}
            >
              Add Contact
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
