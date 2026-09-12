"use client";

import { useState } from "react";
import { X, Home, Trash2, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ContactDto } from "@/features/crm/types/crm-dto";
import { ContactType } from "@/generated/prisma/enums";
import { ListingPicker } from "./ListingPicker";
import { AgentSelect } from "./AgentSelect";
import { ContactRolesSelect } from "./ContactRolesSelect";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type EditContactInput = {
  firstName: string;
  lastName: string;
  // Omitted entirely (not sent as an empty/placeholder string) when the
  // viewer can't see the real value, so the server leaves it untouched.
  email?: string;
  phone?: string;
  roles: ContactType[];
  location: string;
  address: string;
  notes: string;
  propertyIds?: string[];
  assignedAgentId: string | null;
};

type EditContactModalProps = {
  contact: ContactDto;
  onClose: () => void;
  onSave: (id: string, input: EditContactInput) => void;
  isSaving?: boolean;
  // Locks the "Assigned Agent" field to the current user for AGENT holders
  // (mirrors OpportunitiesPage/LeadDetailPage) — null lets ADMIN/MANAGER
  // reassign via the full picker.
  lockedAgent: { id: string; name: string } | null;
};

const inputClass =
  "h-[37.5px] px-3 border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

type PropertyRow = { id: string; label: string };

export function EditContactModal({ contact, onClose, onSave, isSaving, lockedAgent }: EditContactModalProps) {
  const { t } = useTranslation("contacts");
  const [firstName, setFirstName] = useState(contact.firstName);
  const [lastName, setLastName] = useState(contact.lastName);
  const [email, setEmail] = useState(contact.email ?? "");
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [roles, setRoles] = useState<ContactType[]>(contact.roles);
  const [location, setLocation] = useState(contact.location ?? "");
  const [address, setAddress] = useState(contact.address ?? "");
  const [notes, setNotes] = useState(contact.notes ?? "");
  const [assignedAgentId, setAssignedAgentId] = useState(
    lockedAgent?.id ?? contact.assignedAgentId ?? "",
  );
  const [propertyRows, setPropertyRows] = useState<PropertyRow[]>(
    contact.properties
      .filter((p) => p.role === "OWNER")
      .map((p) => ({ id: p.id, label: `${p.listingId} — ${p.title}` })),
  );

  // Phone/email are masked (contact.contactInfoMasked) when the viewer isn't
  // the assigned agent — never let the placeholder round-trip as a real edit.
  const contactInfoLocked = contact.contactInfoMasked;

  const canLinkOwnedProperties = (roles.includes(ContactType.SELLER) || roles.includes(ContactType.OWNER));

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
      // Disabled fields hold the mask placeholder in state, which isn't a
      // real value — omit them so the server leaves email/phone untouched
      // instead of validating/saving the placeholder itself.
      ...(contactInfoLocked ? {} : { email: email.trim(), phone: phone.trim() }),
      roles,
      location: location.trim(),
      address: address.trim(),
      notes: notes.trim(),
      propertyIds: canLinkOwnedProperties ? propertyRows.map((p) => p.id).filter(Boolean) : undefined,
      assignedAgentId: assignedAgentId || null,
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
            <p className="text-[16px] font-semibold text-[#0d2138] leading-6" style={mont}>{t("editModal.title")}</p>
            <p className="text-[12px] text-[#6a7282] mt-0.5" style={mont}>
              {t("editModal.subtitle", { contactId: contact.contactId })}
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
              <label className={labelClass} style={mont}>{t("fields.firstName")}</label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t("fields.firstNamePlaceholder")}
                className={inputClass}
                style={mont}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>{t("fields.lastName")}</label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t("fields.lastNamePlaceholder")}
                className={inputClass}
                style={mont}
              />
            </div>
          </div>

          {/* Email / Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>{t("fields.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("fields.emailPlaceholder")}
                className={inputClass}
                style={mont}
                disabled={contactInfoLocked}
                readOnly={contactInfoLocked}
                title={contactInfoLocked ? t("fields.contactInfoMaskedHint") : undefined}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass} style={mont}>{t("fields.phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("fields.phonePlaceholder")}
                className={inputClass}
                style={mont}
                disabled={contactInfoLocked}
                readOnly={contactInfoLocked}
                title={contactInfoLocked ? t("fields.contactInfoMaskedHint") : undefined}
              />
            </div>
          </div>
          {contactInfoLocked && (
            <p className="-mt-3 flex items-center gap-1.5 text-[12px] text-[#6a7282]" style={mont}>
              <Lock size={12} className="shrink-0" />
              {t("fields.contactInfoMaskedHint")}
            </p>
          )}
          {!contactInfoLocked && !email.trim() && !phone.trim() && (
            <p className="-mt-3 text-[12px] text-[#b45309]" style={mont}>{t("fields.provideEmailOrPhone")}</p>
          )}

          {/* Assigned Agent */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>{t("fields.assignedAgent")}</label>
            <AgentSelect
              value={assignedAgentId}
              onChange={setAssignedAgentId}
              lockedAgent={lockedAgent}
            />
          </div>

          {/* Contact Roles */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>{t("fields.contactType")}</label>
            <ContactRolesSelect value={roles} onChange={setRoles} />
            {roles.length === 0 && (
              <p className="text-[12px] text-[#b45309]" style={mont}>{t("fields.selectAtLeastOneRole")}</p>
            )}
          </div>

          {/* Location */}
          <div className="flex flex-col gap-1.5">
            <label className={labelClass} style={mont}>{t("fields.location")}</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("fields.locationPlaceholder")}
              className={inputClass}
              style={mont}
            />
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#1f2937]" style={mont}>{t("fields.address")}</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("fields.addressPlaceholder")}
              className={inputClass}
              style={mont}
            />
          </div>

          {/* Owned properties — sellers and owners */}
          {canLinkOwnedProperties && (
            <div className="flex flex-col gap-3 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2">
                <Home size={15} className="shrink-0 text-[#1a5ea8]" />
                <p className="text-[12px] font-medium text-[#1a5ea8]" style={mont}>{t("propertyListings.title")}</p>
              </div>
              <p className="text-[12px] leading-5 text-[#6a7282]" style={mont}>
                {t("propertyListings.editDescription")}
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
                className="flex h-9 w-full items-center justify-center rounded-[8px] border-[1.5px] border-[#1a5ea8] px-4 text-[12px] font-medium text-[#1e4f86] transition-colors hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-start"
                style={mont}
              >
                {t("propertyListings.addProperty")}
              </button>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[#1f2937]" style={mont}>{t("fields.notes")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("fields.notesPlaceholder")}
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
              {t("editModal.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSaving || roles.length === 0 || (!email.trim() && !phone.trim())}
              className="flex-1 h-[41.5px] bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={mont}
            >
              {isSaving ? t("editModal.saving") : t("editModal.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
