"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";

const mont = {
  fontFamily: "'Montserrat', sans-serif",
};

export type ListingFilterValues = {
  operationTypes: string[];
  propertyTypes: string[];
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  statuses: string[];
};

export const DEFAULT_LISTING_FILTER_VALUES: ListingFilterValues = {
  operationTypes: [],
  propertyTypes: [],
  minPrice: "",
  maxPrice: "",
  bedrooms: "Any",
  statuses: [],
};

// Displayed labels are translated via the *_I18N_KEY maps below; these
// values stay in stable English because they're compared against directly
// in component state.
const OPERATION_TYPES = ["Sale", "Rent", "Both"];
const OPERATION_TYPE_I18N_KEY: Record<string, string> = {
  Sale: "filterModal.operation.sale",
  Rent: "filterModal.operation.rent",
  Both: "filterModal.operation.both",
};

const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Commercial",
  "Land",
];
const PROPERTY_TYPE_I18N_KEY: Record<string, string> = {
  Apartment: "filterModal.propertyTypeOptions.apartment",
  House: "filterModal.propertyTypeOptions.house",
  Commercial: "filterModal.propertyTypeOptions.commercial",
  Land: "filterModal.propertyTypeOptions.land",
};

const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];
const STATUSES = ["Active", "Paused", "Rented", "Sold"];
const STATUS_I18N_KEY: Record<string, string> = {
  Active: "filterModal.statusOptions.active",
  Paused: "filterModal.statusOptions.paused",
  Rented: "filterModal.statusOptions.rented",
  Sold: "filterModal.statusOptions.sold",
};

type ListingFilterModalProps = {
  resultCount: number;
  initialValues?: ListingFilterValues;
  onApply: (filters: ListingFilterValues) => void;
  onClose: () => void;
};

type CheckboxRowProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
};

function CheckboxRow({
  label,
  checked,
  onToggle,
}: CheckboxRowProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className="flex min-w-0 items-center gap-2.5 text-left"
      style={mont}
    >
      <span
        className={`flex size-[19px] shrink-0 items-center justify-center rounded-[5px] border transition-colors ${
          checked
            ? "border-[#235b96] bg-[#235b96]"
            : "border-[#d9dde3] bg-white"
        }`}
      >
        {checked && (
          <Check
            size={13}
            strokeWidth={2.6}
            className="text-white"
          />
        )}
      </span>

      <span className="whitespace-nowrap text-[14px] text-[#292929] sm:text-[15px]">
        {label}
      </span>
    </button>
  );
}

export function ListingFilterModal({
  resultCount,
  initialValues = DEFAULT_LISTING_FILTER_VALUES,
  onApply,
  onClose,
}: ListingFilterModalProps) {
  const { t } = useTranslation("dashboardListings");
  const [operationTypes, setOperationTypes] = useState<string[]>(
    initialValues.operationTypes,
  );
  const [propertyTypes, setPropertyTypes] = useState<string[]>(
    initialValues.propertyTypes,
  );
  const [minPrice, setMinPrice] = useState(initialValues.minPrice);
  const [maxPrice, setMaxPrice] = useState(initialValues.maxPrice);
  const [bedrooms, setBedrooms] = useState(initialValues.bedrooms);
  const [statuses, setStatuses] = useState<string[]>(initialValues.statuses);

  function toggle(
    list: string[],
    value: string,
    setter: (next: string[]) => void,
  ) {
    setter(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
    );
  }

  function clearAll() {
    setOperationTypes([]);
    setPropertyTypes([]);
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("Any");
    setStatuses([]);
  }

  function handleApply() {
    onApply({
      operationTypes,
      propertyTypes,
      minPrice,
      maxPrice,
      bedrooms,
      statuses,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-filter-title"
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[calc(100dvh-24px)] w-full max-w-[500px] flex-col overflow-hidden rounded-[18px] border border-[#dedede] bg-white shadow-2xl sm:max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#e9e9e9] px-5 py-5 sm:px-7 sm:py-6">
          <h2
            id="listing-filter-title"
            className="text-[17px] font-semibold text-[#202020]"
            style={mont}
          >
            {t("filterModal.title")}
          </h2>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={clearAll}
              className="text-[13px] font-semibold text-[#1265b3] transition-colors hover:text-[#0d4f8e]"
              style={mont}
            >
              {t("filterModal.clearAll")}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={t("filterModal.closeAria")}
              className="flex size-8 items-center justify-center rounded-full text-[#666] transition-colors hover:bg-[#f3f4f6] hover:text-[#111]"
            >
              <X size={20} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-5 py-6 sm:px-7">
          {/* Operation Type */}
          <section className="flex flex-col gap-4">
            <p
              className="text-[14px] text-[#707b90]"
              style={mont}
            >
              {t("filterModal.operationType")}
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 sm:gap-x-10">
              {OPERATION_TYPES.map((type) => (
                <CheckboxRow
                  key={type}
                  label={t(OPERATION_TYPE_I18N_KEY[type])}
                  checked={operationTypes.includes(type)}
                  onToggle={() =>
                    toggle(
                      operationTypes,
                      type,
                      setOperationTypes,
                    )
                  }
                />
              ))}
            </div>
          </section>

          {/* Property Type */}
          <section className="flex flex-col gap-4">
  <p
    className="text-[14px] text-[#707b90]"
    style={mont}
  >
    {t("filterModal.propertyType")}
  </p>

  <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:items-center sm:justify-between">
    {PROPERTY_TYPES.map((type) => (
      <CheckboxRow
        key={type}
        label={t(PROPERTY_TYPE_I18N_KEY[type])}
        checked={propertyTypes.includes(type)}
        onToggle={() =>
          toggle(
            propertyTypes,
            type,
            setPropertyTypes,
          )
        }
      />
    ))}
  </div>
</section>

          {/* Price Range */}
          <section className="flex flex-col gap-4">
            <p
              className="text-[14px] text-[#707b90]"
              style={mont}
            >
              {t("filterModal.priceRange")}
            </p>

            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5 sm:gap-3">
              <input
                type="text"
                value={minPrice}
                onChange={(event) =>
                  setMinPrice(event.target.value)
                }
                placeholder={t("filterModal.minPricePlaceholder")}
                inputMode="numeric"
                className="h-12 min-w-0 w-full rounded-[12px] border border-[#d8d4ce] bg-white px-4 text-[14px] text-[#292929] outline-none transition-colors placeholder:text-[#707b90] focus:border-[#235b96]"
                style={mont}
              />

              <span className="text-[18px] text-[#8c95a5]">
                —
              </span>

              <input
                type="text"
                value={maxPrice}
                onChange={(event) =>
                  setMaxPrice(event.target.value)
                }
                placeholder={t("filterModal.maxPricePlaceholder")}
                inputMode="numeric"
                className="h-12 min-w-0 w-full rounded-[12px] border border-[#d8d4ce] bg-white px-4 text-[14px] text-[#292929] outline-none transition-colors placeholder:text-[#707b90] focus:border-[#235b96]"
                style={mont}
              />
            </div>
          </section>

          {/* Bedrooms */}
          <section className="flex flex-col gap-4">
            <p
              className="text-[14px] text-[#707b90]"
              style={mont}
            >
              {t("filterModal.bedrooms")}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BEDROOM_OPTIONS.map((bedroom) => (
                <button
                  key={bedroom}
                  type="button"
                  onClick={() => setBedrooms(bedroom)}
                  className={`h-10 rounded-[12px] border px-4 text-[14px] transition-colors ${
                    bedrooms === bedroom
                      ? "border-[#235b96] bg-[#eff6ff] font-medium text-[#235b96]"
                      : "border-[#d8d4ce] bg-white text-[#292929] hover:bg-[#f8fafc]"
                  }`}
                  style={mont}
                >
                  {bedroom === "Any" ? t("filterModal.bedroomOptions.any") : bedroom}
                </button>
              ))}
            </div>
          </section>

          {/* Status */}
          <section className="flex flex-col gap-4">
            <p
              className="text-[14px] text-[#707b90]"
              style={mont}
            >
              {t("filterModal.status")}
            </p>

            <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4 sm:gap-x-4">
              {STATUSES.map((status) => (
                <CheckboxRow
                  key={status}
                  label={t(STATUS_I18N_KEY[status])}
                  checked={statuses.includes(status)}
                  onToggle={() =>
                    toggle(statuses, status, setStatuses)
                  }
                />
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#e9e9e9] bg-white px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span
              className="text-center text-[14px] text-[#707b90] sm:text-left"
              style={mont}
            >
              {t("filterModal.resultsCount", { count: resultCount })}
            </span>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <button
                type="button"
                onClick={clearAll}
                className="h-12 rounded-[12px] border border-[#d8d4ce] bg-white px-6 text-[14px] font-medium text-[#707b90] transition-colors hover:bg-[#f5f5f5]"
                style={mont}
              >
                {t("filterModal.reset")}
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="h-12 rounded-[12px] bg-[#235b96] px-7 text-[14px] font-semibold text-white transition-colors hover:bg-[#1c4c80]"
                style={mont}
              >
                {t("filterModal.applyFilters")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

