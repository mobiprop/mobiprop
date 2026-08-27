"use client";

import { useState } from "react";
import { X, Home, Trash2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ContactType } from "@/generated/prisma/enums";
import { ListingPicker } from "./ListingPicker";
import { ContactRolesSelect } from "./ContactRolesSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type NewContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles: ContactType[];
  location: string;
  address: string;
  notes: string;
  // Only sent when roles include SELLER — properties this contact owns.
  propertyIds?: string[];
};

export type ContactConflict = {
  message: string;
  onViewExisting: () => void;
};

type AddContactModalProps = {
  onClose: () => void;
  onCreate?: (contact: NewContact) => void;
  isSaving?: boolean;
  conflict?: ContactConflict | null;
};

type PropertyRow = { id: string; label: string };

export function AddContactModal({
  onClose,
  onCreate,
  isSaving,
  conflict,
}: AddContactModalProps) {
  const { t } = useTranslation("contacts");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [roles, setRoles] = useState<ContactType[]>([ContactType.BUYER]);
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [propertyRows, setPropertyRows] = useState<PropertyRow[]>([]);

  const isSellerType = roles.includes(ContactType.SELLER);

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
    onCreate?.({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      roles,
      location: location.trim(),
      address: address.trim(),
      notes: notes.trim(),
      propertyIds: isSellerType ? propertyRows.map((p) => p.id).filter(Boolean) : undefined,
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
            <p className="text-[15px] font-semibold leading-6 text-[#0d2138] sm:text-[16px]" style={mont}>{t("addModal.title")}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-[#6a7282] sm:text-[12px]" style={mont}>{t("addModal.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("addModal.closeAria")}
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138]"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:gap-5 sm:px-6 sm:py-6">
          {conflict && (
            <div className="flex flex-col gap-2 rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-3.5 sm:p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#b45309]" />
                <p className="text-[12px] leading-5 text-[#92400e]" style={mont}>{conflict.message}</p>
              </div>
              <button
                type="button"
                onClick={conflict.onViewExisting}
                className="self-start rounded-[8px] border border-[#fcd34d] bg-white px-3 py-1.5 text-[11px] font-medium text-[#92400e] transition-colors hover:bg-[#fef3c7] sm:text-[12px]"
                style={mont}
              >
                {t("addModal.openExistingContact")}
              </button>
            </div>
          )}

          {/* First / Last name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>{t("fields.firstName")}</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t("fields.firstNamePlaceholder")}
                className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
                style={mont}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>{t("fields.lastName")}</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t("fields.lastNamePlaceholder")}
                className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
                style={mont}
              />
            </div>
          </div>

          {/* Email / Phone — at least one is required; enforced on submit below */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>{t("fields.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("fields.emailPlaceholder")}
                className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
                style={mont}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>{t("fields.phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("fields.phonePlaceholder")}
                className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
                style={mont}
              />
            </div>
          </div>
          {!email.trim() && !phone.trim() && (
            <p className="-mt-2 text-[11px] text-[#b45309]" style={mont}>{t("fields.provideEmailOrPhone")}</p>
          )}

          {/* Contact Roles */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>{t("fields.contactType")}</label>
            <ContactRolesSelect value={roles} onChange={setRoles} />
            {roles.length === 0 && (
              <p className="text-[11px] text-[#b45309] sm:text-[12px]" style={mont}>{t("fields.selectAtLeastOneRole")}</p>
            )}
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#1f2937] sm:text-[12px]" style={mont}>{t("fields.location")}</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("fields.locationPlaceholder")}
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
              style={mont}
            />
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#1f2937] sm:text-[13px]" style={mont}>{t("fields.address")}</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("fields.addressPlaceholder")}
              className="h-10 rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] text-[#0d2138] outline-none transition-colors placeholder:text-[#6a7282] focus:border-[#1e4f86] sm:h-[35px]"
              style={mont}
            />
          </div>

          {/* Property Listings — sellers only */}
          {isSellerType && (
            <div className="flex flex-col gap-3 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Home size={15} className="shrink-0 text-[#1a5ea8]" />
                <p className="text-[12px] font-medium text-[#1a5ea8]" style={mont}>{t("propertyListings.title")}</p>
              </div>
              <p className="text-[11px] leading-5 text-[#6a7282] sm:text-[12px]" style={mont}>
                {t("propertyListings.addDescription")}
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
                        title={t("propertyListings.removePropertyTitle")}
                        aria-label={t("propertyListings.removePropertyAria")}
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
                className="flex h-9 w-full items-center justify-center rounded-[8px] border-[1.5px] border-[#1a5ea8] px-4 text-[11px] font-medium text-[#1e4f86] transition-colors hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-start sm:text-[12px]"
                style={mont}
              >
                {t("propertyListings.addProperty")}
              </button>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#1f2937] sm:text-[13px]" style={mont}>{t("fields.notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("fields.notesPlaceholder")}
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
              {t("addModal.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving || roles.length === 0 || (!email.trim() && !phone.trim())}
              className="h-[41.5px] rounded-[10px] bg-[#1e4f86] text-[11px] font-medium text-white transition-colors hover:bg-[#1b487a] disabled:cursor-not-allowed disabled:opacity-60 sm:text-[12px]"
              style={mont}
            >
              {isSaving ? t("addModal.saving") : t("addModal.addContact")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
