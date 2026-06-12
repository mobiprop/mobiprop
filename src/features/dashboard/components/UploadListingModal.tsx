"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  X,
  ChevronDown,
  Upload,
  Loader2,
  SquareParking,
  Trees,
  Waves,
  Dumbbell,
  Building2,
  ArrowUpDown,
  ShieldCheck,
  Sofa,
  PawPrint,
  BadgeCheck,
  Wifi,
  Fuel,
  Heater,
  Snowflake,
  Flame,
  WashingMachine,
  Droplets,
  CircleDot,
} from "lucide-react";

import {
  PropertyOperationType,
  PropertyStatus,
  PropertyType,
} from "@/generated/prisma/enums";
import {
  createListingSchema,
  AMENITY_OPTIONS,
  LISTING_IMAGE_MAX_BYTES,
  LISTING_IMAGE_MAX_COUNT,
  LISTING_IMAGE_MIME_TYPES,
  LISTING_STEP_FIELDS,
  type AmenityKey,
} from "@/schemas/listing.schema";
import { useCreateListingMutation } from "@/hooks/mutations/useCreateListingMutation";
import {
  useUpdateListingMutation,
  useAddListingImagesMutation,
  useRemoveListingImageMutation,
} from "@/hooks/mutations/useUpdateListingMutation";
import type { DashboardListingDto } from "@/features/listings/types/listing-dto";
import { TYPE_LABELS, STATUS_LABELS } from "../listings-data";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const STEPS = ["Basic Info", "Listing Details", "Images"] as const;

const AMENITY_ICONS: Record<AmenityKey, React.ComponentType<{ size?: number; className?: string }>> = {
  PARKING: SquareParking,
  GARDEN: Trees,
  POOL: Waves,
  GYM: Dumbbell,
  BALCONY: Building2,
  ELEVATOR: ArrowUpDown,
  SECURITY: ShieldCheck,
  FURNISHED: Sofa,
  PET_FRIENDLY: PawPrint,
  CREDIT_APPROVED: BadgeCheck,
  INTERNET: Wifi,
  GAS: Fuel,
  RADIANT_FLOORS: Heater,
  AIR_CONDITIONING: Snowflake,
  BARBECUE: Flame,
  LAUNDRY: WashingMachine,
  WATER: Droplets,
  TENNIS_COURT: CircleDot,
};

// Form values keep numeric inputs as strings (what <input> produces); the
// schema's preprocess coerces them, and we re-parse on submit for the payload.
type ListingFormValues = {
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  operationType: PropertyOperationType;
  salePrice: string;
  rentPrice: string;
  location: string;
  fullAddress: string;
  isFeatured: boolean;
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  areaSqft: string;
  yearBuilt: string;
  description: string;
  amenities: AmenityKey[];
};

const EMPTY_VALUES: ListingFormValues = {
  title: "",
  type: PropertyType.APARTMENT,
  status: PropertyStatus.ACTIVE,
  operationType: PropertyOperationType.SALE,
  salePrice: "",
  rentPrice: "",
  location: "",
  fullAddress: "",
  isFeatured: false,
  bedrooms: "",
  bathrooms: "",
  toilets: "",
  areaSqft: "",
  yearBuilt: "",
  description: "",
  amenities: [],
};

function valuesFromListing(listing: DashboardListingDto): ListingFormValues {
  return {
    title: listing.title,
    type: listing.type,
    status: listing.status,
    operationType: listing.operationType,
    salePrice: listing.salePrice?.toString() ?? "",
    rentPrice: listing.rentPrice?.toString() ?? "",
    location: listing.location,
    fullAddress: listing.fullAddress,
    isFeatured: listing.isFeatured,
    bedrooms: listing.bedrooms?.toString() ?? "",
    bathrooms: listing.bathrooms?.toString() ?? "",
    toilets: listing.toilets?.toString() ?? "",
    areaSqft: listing.areaSqft?.toString() ?? "",
    yearBuilt: listing.yearBuilt?.toString() ?? "",
    description: listing.description,
    amenities: listing.amenities,
  };
}

type NewImage = { file: File; preview: string };

type UploadListingModalProps = {
  onClose: () => void;
  /** When set, the modal edits this listing instead of creating a new one. */
  listing?: DashboardListingDto;
  canFeature: boolean;
};

const inputClass =
  "h-10 px-3.5 bg-[#fafbfc] border rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors";
const labelClass = "text-[12px] font-medium text-[#1f2937]";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[11px] text-[#e7000b]" style={mont}>
      {message}
    </p>
  );
}

function borderClass(hasError: boolean) {
  return hasError ? "border-[#e7000b]" : "border-[#e5e7eb]";
}

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

export function UploadListingModal({ onClose, listing, canFeature }: UploadListingModalProps) {
  const isEdit = listing !== undefined;
  const [step, setStep] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [imagesError, setImagesError] = useState<string | null>(null);

  const createMutation = useCreateListingMutation();
  const updateMutation = useUpdateListingMutation();
  const addImagesMutation = useAddListingImagesMutation();
  const removeImageMutation = useRemoveListingImageMutation();
  // Existing images shown in edit mode; kept in local state so removals/cover
  // changes (applied immediately via mutations) reflect without a refetch.
  const [existingImages, setExistingImages] = useState(listing?.images ?? []);

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || addImagesMutation.isPending;

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ListingFormValues>({
    // The schema transforms string inputs to numbers, so its generic output
    // differs from the form values type; behavior-wise this resolver only
    // reports issues, hence the cast.
    resolver: zodResolver(createListingSchema) as unknown as Resolver<ListingFormValues>,
    defaultValues: listing ? valuesFromListing(listing) : EMPTY_VALUES,
    mode: "onTouched",
  });

  const operationType = watch("operationType");
  const amenities = watch("amenities");
  const isFeatured = watch("isFeatured");

  const hasSale =
    operationType === PropertyOperationType.SALE ||
    operationType === PropertyOperationType.SALE_AND_RENT;
  const hasRent =
    operationType === PropertyOperationType.RENT ||
    operationType === PropertyOperationType.SALE_AND_RENT;

  // Object URLs leak unless revoked; clean up whenever the set changes/unmounts.
  useEffect(() => {
    return () => newImages.forEach((img) => URL.revokeObjectURL(img.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleOperation(op: "Sale" | "Rent") {
    const next =
      op === "Sale"
        ? hasSale
          ? hasRent
            ? PropertyOperationType.RENT
            : PropertyOperationType.SALE // keep at least one selected
          : hasRent
            ? PropertyOperationType.SALE_AND_RENT
            : PropertyOperationType.SALE
        : hasRent
          ? hasSale
            ? PropertyOperationType.SALE
            : PropertyOperationType.RENT
          : hasSale
            ? PropertyOperationType.SALE_AND_RENT
            : PropertyOperationType.RENT;
    setValue("operationType", next, { shouldValidate: true });
  }

  function toggleAmenity(key: AmenityKey) {
    const next = amenities.includes(key)
      ? amenities.filter((k) => k !== key)
      : [...amenities, key];
    setValue("amenities", next);
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const totalCount = existingImages.length + newImages.length + files.length;
    if (totalCount > LISTING_IMAGE_MAX_COUNT) {
      setImagesError(`A listing can have at most ${LISTING_IMAGE_MAX_COUNT} images.`);
      return;
    }
    for (const file of files) {
      if (!LISTING_IMAGE_MIME_TYPES.includes(file.type)) {
        setImagesError("Only JPG, PNG, and WebP images are allowed.");
        return;
      }
      if (file.size > LISTING_IMAGE_MAX_BYTES) {
        setImagesError(`"${file.name}" is larger than 10MB.`);
        return;
      }
    }

    setImagesError(null);
    setNewImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newImages[index].preview);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setCoverIndex((prev) => (index === prev ? 0 : index < prev ? prev - 1 : prev));
  }

  async function removeExistingImage(imageId: string) {
    if (!listing) return;
    try {
      const result = await removeImageMutation.mutateAsync({ id: listing.id, imageId });
      setExistingImages(result.listing.images);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove image");
    }
  }

  async function nextStep() {
    const valid = await trigger(LISTING_STEP_FIELDS[step] as (keyof ListingFormValues)[]);
    if (valid) setStep((s) => s + 1);
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!isEdit && newImages.length === 0 && values.status !== PropertyStatus.DRAFT) {
      setImagesError("At least one image is required to publish a listing.");
      return;
    }

    // The resolver validated; parse again to get the coerced (numeric) payload.
    const payload = createListingSchema.parse(values);

    try {
      if (isEdit && listing) {
        await updateMutation.mutateAsync({ id: listing.id, data: payload });
        if (newImages.length > 0) {
          await addImagesMutation.mutateAsync({
            id: listing.id,
            images: newImages.map((i) => i.file),
          });
        }
        toast.success("Listing updated");
      } else {
        await createMutation.mutateAsync({
          data: payload,
          images: newImages.map((i) => i.file),
          coverIndex,
        });
        toast.success("Listing created");
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  });

  const stepHasErrors = useMemo(
    () => (LISTING_STEP_FIELDS[step] ?? []).some((field) => field in errors),
    [errors, step],
  );

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
            <p className="text-[16px] font-semibold text-[#0d2138] leading-6" style={mont}>
              {isEdit ? "Edit Listing" : "Upload New Listing"}
            </p>
            <p className="text-[12px] text-[#6a7282] mt-0.5" style={mont}>Step {step + 1} of {STEPS.length}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-[10px] text-[#6a7282] hover:bg-[#f3f4f6] hover:text-[#0d2138] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-5 grid grid-cols-3 gap-3">
          {STEPS.map((label, i) => (
            <button key={label} type="button" onClick={() => i < step && setStep(i)} className="flex flex-col gap-2 text-left">
              <div className={`h-1 rounded-full ${i <= step ? "bg-[#1e4f86]" : "bg-[#e5e7eb]"}`} />
              <span className={`text-[12px] font-medium ${i <= step ? "text-[#1e4f86]" : "text-[#6a7282]"}`} style={mont}>{label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="px-6 py-6 flex flex-col gap-5">
          {/* ── Step 1: Basic Info ── */}
          {step === 0 && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={mont}>Listing Name *</label>
                <input {...register("title")} placeholder="e.g., Modern Downtown Apartment" className={`${inputClass} ${borderClass(!!errors.title)}`} style={mont} />
                <FieldError message={errors.title?.message} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Listing Type *</label>
                  <div className="relative">
                    <select {...register("type")} className={`w-full h-10 pl-3 pr-9 bg-[#fafbfc] border ${borderClass(!!errors.type)} rounded-[10px] text-[12px] text-[#232323] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer`} style={mont}>
                      {Object.entries(TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Status *</label>
                  <div className="relative">
                    <select {...register("status")} className={`w-full h-10 pl-3 pr-9 bg-[#fafbfc] border ${borderClass(!!errors.status)} rounded-[10px] text-[12px] text-[#232323] appearance-none outline-none focus:border-[#1e4f86] transition-colors cursor-pointer`} style={mont}>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Operation Type */}
              <div className="flex flex-col gap-2">
                <label className={labelClass} style={mont}>Operation Type *</label>
                <div className="flex items-center gap-3">
                  {(["Sale", "Rent"] as const).map((op) => {
                    const active = op === "Sale" ? hasSale : hasRent;
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
                    <input type="number" {...register("salePrice")} placeholder="450000" className={`${inputClass} ${borderClass(!!errors.salePrice)}`} style={mont} />
                    <FieldError message={errors.salePrice?.message} />
                  </div>
                )}
                {hasRent && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClass} style={mont}>Rent Price *</label>
                    <input type="number" {...register("rentPrice")} placeholder="1200" className={`${inputClass} ${borderClass(!!errors.rentPrice)}`} style={mont} />
                    <FieldError message={errors.rentPrice?.message} />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={mont}>Location *</label>
                <input {...register("location")} placeholder="Buenos Aires, Argentina" className={`${inputClass} ${borderClass(!!errors.location)}`} style={mont} />
                <FieldError message={errors.location?.message} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={mont}>Full Address *</label>
                <input {...register("fullAddress")} placeholder="1234 Main Street, Downtown" className={`${inputClass} ${borderClass(!!errors.fullAddress)}`} style={mont} />
                <FieldError message={errors.fullAddress?.message} />
              </div>

              {/* Featured toggle */}
              {canFeature && (
                <div className="flex items-center justify-between gap-3 bg-[#f8fafc] border border-[#e5e7eb] rounded-[10px] px-4 py-3.5">
                  <div className="flex flex-col">
                    <p className="text-[14px] font-medium text-[#1f2937]" style={mont}>Featured listing</p>
                    <p className="text-[12px] text-[#6a7282]" style={mont}>Highlight this property at the top of listings</p>
                  </div>
                  <Toggle checked={isFeatured} onChange={(v) => setValue("isFeatured", v)} />
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Listing Details ── */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-3 gap-5">
                {([
                  ["bedrooms", "Bedrooms *", "3"],
                  ["bathrooms", "Bathrooms *", "2"],
                  ["areaSqft", "Area (sqft) *", "1200"],
                ] as const).map(([field, label, placeholder]) => (
                  <div key={field} className="flex flex-col gap-1.5">
                    <label className={labelClass} style={mont}>{label}</label>
                    <input type="number" {...register(field)} placeholder={placeholder} className={`${inputClass} ${borderClass(!!errors[field])}`} style={mont} />
                    <FieldError message={errors[field]?.message} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Year Built *</label>
                  <input type="number" {...register("yearBuilt")} placeholder="2020" className={`${inputClass} ${borderClass(!!errors.yearBuilt)}`} style={mont} />
                  <FieldError message={errors.yearBuilt?.message} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass} style={mont}>Toilettes *</label>
                  <input type="number" {...register("toilets")} placeholder="2" className={`${inputClass} ${borderClass(!!errors.toilets)}`} style={mont} />
                  <FieldError message={errors.toilets?.message} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass} style={mont}>Description *</label>
                <textarea
                  {...register("description")}
                  placeholder="Describe the listing, its features, and unique selling points..."
                  rows={4}
                  className={`px-3.5 py-2.5 bg-[#fafbfc] border ${borderClass(!!errors.description)} rounded-[10px] text-[12px] text-[#0d2138] placeholder:text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors resize-none`}
                  style={mont}
                />
                <FieldError message={errors.description?.message} />
              </div>
              <div className="flex flex-col gap-3">
                <label className={labelClass} style={mont}>Features &amp; Amenities</label>
                <div className="grid grid-cols-3 gap-3">
                  {AMENITY_OPTIONS.map(({ key, label }) => {
                    const Icon = AMENITY_ICONS[key];
                    const active = amenities.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleAmenity(key)}
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
                <input ref={fileRef} type="file" accept={LISTING_IMAGE_MIME_TYPES.join(",")} multiple className="hidden" onChange={handleFiles} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`w-full border-2 border-dashed ${imagesError ? "border-[#e7000b]" : "border-[#e5e7eb]"} rounded-[10px] bg-[#fafbfc] hover:bg-[#f3f4f6] transition-colors flex flex-col items-center justify-center gap-3 py-10 text-center`}
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
                <FieldError message={imagesError ?? undefined} />
              </div>

              {existingImages.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-[12px] font-medium text-[#1f2937]" style={mont}>Current Images ({existingImages.length})</p>
                  <div className="grid grid-cols-4 gap-3">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative aspect-square rounded-[10px] overflow-hidden border border-[#e5e7eb] group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt={image.altText ?? "Listing image"} className="size-full object-cover" />
                        {image.isCover && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[6px] bg-[#1e4f86] text-white text-[10px] font-medium" style={mont}>Cover</span>
                        )}
                        <button
                          type="button"
                          title="Remove image"
                          onClick={() => removeExistingImage(image.id)}
                          disabled={removeImageMutation.isPending}
                          className="absolute top-2 right-2 size-6 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newImages.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-[12px] font-medium text-[#1f2937]" style={mont}>
                    {isEdit ? `New Images (${newImages.length})` : `Uploaded Images (${newImages.length})`}
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {newImages.map((image, i) => (
                      <div key={image.preview} className="relative aspect-square rounded-[10px] overflow-hidden border border-[#e5e7eb] group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.preview}
                          alt={`Upload ${i + 1}`}
                          className="size-full object-cover cursor-pointer"
                          onClick={() => !isEdit && setCoverIndex(i)}
                          title={isEdit ? undefined : "Click to set as cover"}
                        />
                        {!isEdit && i === coverIndex && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[6px] bg-[#1e4f86] text-white text-[10px] font-medium" style={mont}>Cover</span>
                        )}
                        <button
                          type="button"
                          title="Remove image"
                          onClick={() => removeNewImage(i)}
                          className="absolute top-2 right-2 size-6 rounded-full bg-black/55 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {!isEdit && (
                    <p className="text-[11px] text-[#9ca3af]" style={mont}>Click an image to mark it as the cover.</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="sticky bottom-0 -mx-6 -mb-6 bg-white flex items-center justify-between gap-3 px-6 py-4 border-t border-[#e5e7eb]">
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
              <button type="button" onClick={nextStep} className="h-10 px-5 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors" style={mont}>
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                style={mont}
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Submit"}
              </button>
            )}
          </div>
          {stepHasErrors && (
            <p className="text-[11px] text-[#e7000b] text-right -mt-3" style={mont}>
              Please fix the highlighted fields.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
