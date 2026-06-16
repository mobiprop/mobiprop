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
  <div
    className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4"
    onClick={onClose}
  >
    <div className="absolute inset-0 bg-black/40" />

    <div
      className="relative flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-[16px] bg-white shadow-xl sm:max-h-[90vh] sm:max-w-[700px]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6 sm:pb-[25px] sm:pt-6">
        <div className="min-w-0 pr-3">
          <p
            className="text-[15px] font-semibold leading-6 text-[#0d2138] sm:text-[16px]"
            style={mont}
          >
            Add New Contact
          </p>

          <p
            className="mt-0.5 text-[11px] leading-4 text-[#6a7282] sm:text-[12px]"
            style={mont}
          >
            Add a new client or prospect to your database
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
        >
          <X size={19} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:gap-5 sm:px-6 sm:py-6"
      >
        {/* First / Last name */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              First Name *
            </label>

            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              Last Name *
            </label>

            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
              style={mont}
            />
          </div>
        </div>

        {/* Email / Phone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              Email Address *
            </label>

            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@email.com"
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
              style={mont}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              Phone Number *
            </label>

            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 11 1234-5678"
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
              style={mont}
            />
          </div>
        </div>

        {/* Contact Type / Location */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              Contact Type *
            </label>

            <div className="relative">
              <select
                required
                value={contactType}
                onChange={(e) =>
                  setContactType(e.target.value as ContactType)
                }
                className="h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#e5e7eb] bg-white pl-3 pr-8 text-[12px] text-[#232323] outline-none transition-colors focus:border-[#1e4f86] sm:h-[35px]"
                style={mont}
              >
                <option value="Buyer">Buyer</option>
                <option value="Seller">Seller</option>
              </select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6a7282]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]"
              style={mont}
            >
              Location
            </label>

            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Province"
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
              style={mont}
            />
          </div>
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[11px] font-semibold text-[#1f2937] sm:text-[13px]"
            style={mont}
          >
            Address
          </label>

          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
            className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
            style={mont}
          />
        </div>

        {/* Property Listings — sellers only */}
        {isSeller && (
          <div className="flex flex-col gap-3 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Home size={15} className="shrink-0 text-[#1a5ea8]" />

              <p
                className="text-[12px] font-medium text-[#1a5ea8]"
                style={mont}
              >
                Property Listings
              </p>
            </div>

            <p
              className="text-[11px] leading-5 text-[#6a7282] sm:text-[12px]"
              style={mont}
            >
              Add properties this seller owns to identify and link them to
              this contact.
            </p>

            <div className="flex flex-col gap-2.5">
              {properties.map((property, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[24px_minmax(0,1fr)] gap-2 sm:flex sm:items-center sm:gap-2.5"
                >
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1e4f86] text-[11px] font-semibold text-white"
                    style={mont}
                  >
                    {index + 1}
                  </span>

                  <input
                    value={property}
                    onChange={(e) =>
                      updateProperty(index, e.target.value)
                    }
                    placeholder="Property address or listing ID"
                    className="h-9 min-w-0 rounded-[8px] border-[1.5px] border-[#c2dcff] bg-white px-3 text-[11px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:flex-1 sm:text-[12px]"
                    style={mont}
                  />

                  <button
                    type="button"
                    className="col-start-2 flex h-9 items-center justify-center gap-2 rounded-[8px] bg-[#1e4f86] px-3 text-[11px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:col-start-auto sm:shrink-0 sm:text-[12px]"
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
                      aria-label="Remove property"
                      className="col-start-2 flex size-9 items-center justify-center justify-self-end text-[#6a7282] transition-colors hover:text-[#fb2c36] sm:col-start-auto sm:shrink-0"
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
              className="flex h-9 w-full items-center justify-center rounded-[8px] border-[1.5px] border-[#1a5ea8] px-4 text-[11px] font-medium text-[#1e4f86] transition-colors hover:bg-[#eff6ff] sm:w-auto sm:self-start sm:text-[12px]"
              style={mont}
            >
              Add Property
            </button>
          </div>
        )}

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[11px] font-semibold text-[#1f2937] sm:text-[13px]"
            style={mont}
          >
            Notes
          </label>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about this contact..."
            rows={3}
            className="min-h-[88px] resize-none rounded-[10px] border border-[#e5e7eb] px-3 py-2 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86]"
            style={mont}
          />
        </div>

        {/* Actions */}
        <div className="relative bottom-0 z-10 -mx-4 -mb-4 grid grid-cols-2 gap-2 border-t border-[#e5e7eb] bg-white px-4 py-3 sm:static sm:mx-0 sm:mb-0 sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-[41.5px] rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] text-[11px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] sm:text-[12px]"
            style={mont}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="h-[41.5px] rounded-[10px] bg-[#1e4f86] text-[11px] font-medium text-white transition-colors hover:bg-[#1b487a] sm:text-[12px]"
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
