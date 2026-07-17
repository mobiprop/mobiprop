
"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { LocationDto } from "@/features/locations/types/location-dto";
import { PlaceAutocompleteInput } from "@/components/maps/PlaceAutocompleteInput";

function addressComponent(
  components: google.maps.places.AddressComponent[] | undefined,
  type: string,
): string {
  return components?.find((c) => c.types.includes(type))?.longText ?? "";
}

const mont = { fontFamily: "'Montserrat', sans-serif" };

export type LocationFormValues = {
  name: string;
  region: string;
  address: string;
  postalCode: string;
};

type EditLocationModalProps = {
  location?: LocationDto | null;
  onClose: () => void;
  onSubmit: (values: LocationFormValues) => void;
  /** True while the parent's create/update mutation is in flight — disables
   * the submit button so a double click or double Enter can't fire two
   * requests and create a duplicate location. */
  isSubmitting?: boolean;
};

const inputClass =
  "w-full min-w-0 h-10 px-3.5 bg-[#fafbfc] border border-[#e5e7eb] rounded-[10px] text-[12px] text-[#0a0a0a] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 transition-colors";

const labelClass = "text-[12px] text-[#1f2937]";

export function EditLocationModal({
  location,
  onClose,
  onSubmit,
  isSubmitting = false,
}: EditLocationModalProps) {
  const { t } = useTranslation("dashboard");
  const [name, setName] = useState(location?.name ?? "");
  const [region, setRegion] = useState(location?.region ?? "");
  const [address, setAddress] = useState(location?.address ?? "");
  const [postalCode, setPostalCode] = useState(
    location?.postalCode ?? "",
  );

  const isEdit = Boolean(location);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (isSubmitting) return;

    onSubmit({
      name: name.trim(),
      region: region.trim(),
      address: address.trim(),
      postalCode: postalCode.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Modal */}
      <div
        className="relative z-10 flex w-full max-w-[520px] max-h-[calc(100dvh-24px)] flex-col overflow-hidden rounded-[18px] bg-white shadow-xl sm:max-h-[92dvh] sm:rounded-[14px]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p
                id="location-modal-title"
                className="break-words text-[15px] font-semibold leading-6 text-[#1f2937] sm:text-[16px]"
                style={mont}
              >
                {isEdit
                  ? t("locationModal.editTitle")
                  : t("locationModal.addTitle")}
              </p>

              <p
                className="mt-0.5 break-words text-[11px] leading-5 text-[#6a7282] sm:text-[12px]"
                style={mont}
              >
                {isEdit
                  ? t("locationModal.editSubtitle")
                  : t("locationModal.addSubtitle")}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label={t("locationModal.closeAria")}
              className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Scrollable content */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
            <div className="flex min-w-0 flex-col gap-5 sm:gap-6">
              {/* Location name */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="location-name"
                  className={labelClass}
                  style={mont}
                >
                  {t("locationModal.name")}
                </label>

                <input
                  id="location-name"
                  required
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder={t("locationModal.namePlaceholder")}
                  className={inputClass}
                  style={mont}
                />
              </div>

              {/* Address */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="location-address"
                  className={labelClass}
                  style={mont}
                >
                  {t("locationModal.address")}
                </label>

                <PlaceAutocompleteInput
                  id="location-address"
                  value={address}
                  onChange={setAddress}
                  onPlaceSelected={(place) => {
                    if (place.formattedAddress) setAddress(place.formattedAddress);
                    const province = addressComponent(place.addressComponents, "administrative_area_level_1");
                    if (province) setRegion(province);
                    const postal = addressComponent(place.addressComponents, "postal_code");
                    if (postal) setPostalCode(postal);
                  }}
                  fields={["formattedAddress", "addressComponents"]}
                  placeholder={t("locationModal.addressPlaceholder")}
                  required
                  className={inputClass}
                  style={mont}
                />
              </div>

              {/* Region */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="location-region"
                  className={labelClass}
                  style={mont}
                >
                  {t("locationModal.region")}
                </label>

                <input
                  id="location-region"
                  required
                  value={region}
                  onChange={(event) =>
                    setRegion(event.target.value)
                  }
                  placeholder={t("locationModal.regionPlaceholder")}
                  className={inputClass}
                  style={mont}
                />
              </div>

              {/* Postal code */}
              <div className="flex min-w-0 flex-col gap-2">
                <label
                  htmlFor="location-postal-code"
                  className={labelClass}
                  style={mont}
                >
                  {t("locationModal.postalCode")}
                </label>

                <input
                  id="location-postal-code"
                  required
                  value={postalCode}
                  onChange={(event) =>
                    setPostalCode(event.target.value)
                  }
                  placeholder={t("locationModal.postalCodePlaceholder")}
                  className={inputClass}
                  style={mont}
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="shrink-0 border-t border-[#e5e7eb] bg-white p-4 sm:px-6 sm:py-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="min-h-10 w-full flex-1 rounded-[10px] border border-[#e5e7eb] bg-white px-5 text-[12px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/20 disabled:cursor-not-allowed disabled:opacity-60"
                style={mont}
              >
                {t("locationModal.cancel")}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-10 w-full flex-1 rounded-[10px] bg-[#1e4f86] px-5 text-[12px] font-medium text-white transition-colors hover:bg-[#1b487a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 disabled:cursor-not-allowed disabled:opacity-60"
                style={mont}
              >
                {isSubmitting
                  ? t("locationModal.saving")
                  : isEdit
                    ? t("locationModal.saveChanges")
                    : t("locationModal.addLocation")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

