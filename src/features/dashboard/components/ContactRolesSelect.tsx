"use client";

import { useTranslation } from "react-i18next";

import { ContactType } from "@/generated/prisma/enums";
import { SELECTABLE_CONTACT_ROLES } from "@/schemas/contact.schema";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const ROLE_I18N_KEY: Record<ContactType, string> = {
  [ContactType.BUYER]: "buyer",
  [ContactType.SELLER]: "seller",
  [ContactType.TENANT]: "tenant",
  [ContactType.OWNER]: "owner",
  [ContactType.REAL_ESTATE_COMPANY]: "realEstateCompany",
  [ContactType.BOTH]: "both",
};

type ContactRolesSelectProps = {
  value: ContactType[];
  onChange: (next: ContactType[]) => void;
  disabled?: boolean;
};

// Toggle-pill multi-select for a contact's roles (item #16) — mirrors the
// amenities picker's toggle-pill pattern in UploadListingModal.tsx.
export function ContactRolesSelect({ value, onChange, disabled }: ContactRolesSelectProps) {
  const { t } = useTranslation("contacts");

  function toggle(role: ContactType) {
    if (disabled) return;
    onChange(value.includes(role) ? value.filter((r) => r !== role) : [...value, role]);
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {SELECTABLE_CONTACT_ROLES.map((role) => {
        const isActive = value.includes(role);
        return (
          <button
            key={role}
            type="button"
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => toggle(role)}
            className={`flex h-10 min-w-0 items-center justify-center rounded-[10px] border px-3 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isActive
                ? "border-[#1e4f86] bg-[#eff6ff] font-medium text-[#1e4f86]"
                : "border-[#e5e7eb] bg-[#fafbfc] text-[#6a7282] hover:bg-[#f3f4f6]"
            }`}
            style={mont}
          >
            {t(`type.${ROLE_I18N_KEY[role]}`)}
          </button>
        );
      })}
    </div>
  );
}

type ContactRoleSingleSelectProps = {
  value: ContactType;
  onChange: (next: ContactType) => void;
  disabled?: boolean;
};

// Single-select variant of the pill picker above — used where a contact can
// only take on one role in context (e.g. the Lead → Opportunity conversion's
// "Add Contact" panel), unlike a Contact's own `roles` field which is
// genuinely multi-valued.
export function ContactRoleSingleSelect({ value, onChange, disabled }: ContactRoleSingleSelectProps) {
  const { t } = useTranslation("contacts");

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup">
      {SELECTABLE_CONTACT_ROLES.map((role) => {
        const isActive = value === role;
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => !disabled && onChange(role)}
            className={`flex h-10 min-w-0 items-center justify-center rounded-[10px] border px-3 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              isActive
                ? "border-[#1e4f86] bg-[#eff6ff] font-medium text-[#1e4f86]"
                : "border-[#e5e7eb] bg-[#fafbfc] text-[#6a7282] hover:bg-[#f3f4f6]"
            }`}
            style={mont}
          >
            {t(`type.${ROLE_I18N_KEY[role]}`)}
          </button>
        );
      })}
    </div>
  );
}
