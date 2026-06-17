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
  useSetListingCoverMutation,
} from "@/hooks/mutations/useUpdateListingMutation";
import type { DashboardListingDto } from "@/features/listings/types/listing-dto";
import type { ListingInput } from "@/schemas/listing.schema";
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

// Cover choice across both image lists: an already-stored image (edit mode)
// or one of the newly added files (by index). Null lets the server decide.
type CoverChoice = { existingId: string } | { newIndex: number } | null;

type UploadListingModalProps = {
  onClose: () => void;
  /** When set, the modal edits this listing instead of creating a new one. */
  listing?: DashboardListingDto;
  canFeature: boolean;
};

/**
 * Returns only the fields that changed vs the saved listing.
 * Sending a minimal diff avoids unnecessary DB writes and geocode calls.
 * When operationType changes we always include both prices so the server's
 * conditional price validation has them available.
 */
function buildUpdateDiff(listing: DashboardListingDto, parsed: ListingInput): Partial<ListingInput> {
  const diff: Partial<ListingInput> = {};

  if (parsed.title !== listing.title) diff.title = parsed.title;
  if (parsed.type !== listing.type) diff.type = parsed.type;
  if (parsed.status !== listing.status) diff.status = parsed.status;
  if (parsed.operationType !== listing.operationType) diff.operationType = parsed.operationType;
  if (parsed.salePrice !== (listing.salePrice ?? undefined)) diff.salePrice = parsed.salePrice;
  if (parsed.rentPrice !== (listing.rentPrice ?? undefined)) diff.rentPrice = parsed.rentPrice;
  if (parsed.location !== listing.location) diff.location = parsed.location;
  if (parsed.fullAddress !== listing.fullAddress) diff.fullAddress = parsed.fullAddress;
  if (parsed.isFeatured !== listing.isFeatured) diff.isFeatured = parsed.isFeatured;
  if (parsed.bedrooms !== (listing.bedrooms ?? undefined)) diff.bedrooms = parsed.bedrooms;
  if (parsed.bathrooms !== (listing.bathrooms ?? undefined)) diff.bathrooms = parsed.bathrooms;
  if (parsed.toilets !== (listing.toilets ?? undefined)) diff.toilets = parsed.toilets;
  if (parsed.areaSqft !== (listing.areaSqft ?? undefined)) diff.areaSqft = parsed.areaSqft;
  if (parsed.yearBuilt !== (listing.yearBuilt ?? undefined)) diff.yearBuilt = parsed.yearBuilt;
  if (parsed.description !== listing.description) diff.description = parsed.description;

  // operationType change: always include both prices so the server's
  // conditional price validation (requires relevant prices) can run.
  if (diff.operationType !== undefined) {
    diff.salePrice = parsed.salePrice;
    diff.rentPrice = parsed.rentPrice;
  }

  const origAmenities = [...listing.amenities].sort().join(",");
  const newAmenities = [...parsed.amenities].sort().join(",");
  if (origAmenities !== newAmenities) diff.amenities = parsed.amenities;

  return diff;
}

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
  // Guards against the Save button absorbing the tail of a double-click on
  // "Next Step" (the two buttons render in the same footer slot).
  const lastStepChangeAt = useRef(0);

  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [cover, setCover] = useState<CoverChoice>(() => {
    const current = listing?.images.find((i) => i.isCover);
    return current ? { existingId: current.id } : null;
  });
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const createMutation = useCreateListingMutation();
  const updateMutation = useUpdateListingMutation();
  const addImagesMutation = useAddListingImagesMutation();
  const removeImageMutation = useRemoveListingImageMutation();
  const setCoverMutation = useSetListingCoverMutation();
  // Existing images shown in edit mode. Removals only update local state here;
  // the DELETE calls are deferred until submit so nothing hits the API (or
  // closes the modal) before the user saves.
  const [existingImages, setExistingImages] = useState(listing?.images ?? []);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    addImagesMutation.isPending ||
    removeImageMutation.isPending ||
    setCoverMutation.isPending;

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
  const status = watch("status");

  const totalImages = existingImages.length + newImages.length;

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
    addFiles(files);
  }

  // Shared by the file picker and drag-and-drop.
  function addFiles(files: File[]) {
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
    setCover((prev) => {
      if (!prev || !("newIndex" in prev)) return prev;
      if (index === prev.newIndex) return null;
      return index < prev.newIndex ? { newIndex: prev.newIndex - 1 } : prev;
    });
  }

  function removeExistingImage(imageId: string) {
    setRemovedImageIds((prev) => [...prev, imageId]);
    setExistingImages((prev) => prev.filter((image) => image.id !== imageId));
    setCover((prev) => (prev && "existingId" in prev && prev.existingId === imageId ? null : prev));
    setImagesError(null);
  }

  async function nextStep() {
    const valid = await trigger(LISTING_STEP_FIELDS[step] as (keyof ListingFormValues)[]);
    if (valid) {
      lastStepChangeAt.current = Date.now();
      setStep((s) => s + 1);
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if (totalImages === 0 && values.status !== PropertyStatus.DRAFT) {
      setImagesError("At least one image is required to publish a listing.");
      return;
    }

    // Parse again after resolver to get coerced (numeric) values.
    const parsed = createListingSchema.parse(values);

    try {
      if (isEdit && listing) {
        const diff = buildUpdateDiff(listing, parsed);
        const hasFieldChanges = Object.keys(diff).length > 0;

        // Phase 1 — field update and image upload are independent: run in parallel.
        // Add new images before removing so the listing never dips below 1 image.
        const [, addResult] = await Promise.all([
          hasFieldChanges
            ? updateMutation.mutateAsync({ id: listing.id, data: diff })
            : Promise.resolve(null),
          newImages.length > 0
            ? addImagesMutation.mutateAsync({
                id: listing.id,
                images: newImages.map((i) => i.file),
              })
            : Promise.resolve(null),
        ]);

        // Phase 2 — remove unwanted images in parallel (new images are already saved).
        if (removedImageIds.length > 0) {
          await Promise.all(
            removedImageIds.map((imageId) =>
              removeImageMutation.mutateAsync({ id: listing.id, imageId }),
            ),
          );
        }

        // Phase 3 — set cover last so neither adds nor removes can override it.
        // Map new-image index → the actual DB id from the add result.
        const addedImages = addResult
          ? [...addResult.listing.images]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .slice(-newImages.length)
          : [];
        const originalCoverId = listing.images.find((i) => i.isCover)?.id;
        const desiredCoverId =
          cover && "existingId" in cover
            ? cover.existingId !== originalCoverId
              ? cover.existingId
              : undefined
            : cover
              ? addedImages[cover.newIndex]?.id
              : undefined;
        if (desiredCoverId) {
          await setCoverMutation.mutateAsync({ id: listing.id, imageId: desiredCoverId });
        }

        toast.success("Listing updated");
      } else {
        await createMutation.mutateAsync({
          data: parsed,
          images: newImages.map((i) => i.file),
          coverIndex: cover && "newIndex" in cover ? cover.newIndex : 0,
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

  const isExistingCover = (id: string) =>
    cover !== null && "existingId" in cover && cover.existingId === id;
  // With no explicit choice, create mode defaults the first new image to cover
  // (matching the server); in edit mode the server keeps/promotes one itself.
  const newCoverIndex =
    cover === null ? (isEdit ? -1 : 0) : "newIndex" in cover ? cover.newIndex : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Close only on a press that starts on the dim layer; clicks inside the
          dialog (or drags that end outside it) can never dismiss the modal. */}
      <div className="absolute inset-0 bg-black/40" onMouseDown={onClose} />
      <div className="relative bg-white rounded-[14px] w-full max-w-[850px] max-h-[92vh] overflow-y-auto shadow-xl">
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

        <form
          // Native form submission (Enter key, implicit submission, leaked
          // events from the file dialog) is fully disabled; saving happens
          // only via the Save button's onClick.
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            // Enter inside a field must not submit the multi-step form.
            if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
              e.preventDefault();
            }
          }}
          className="px-6 py-6 flex flex-col gap-5"
        >
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
                  onClick={(e) => {
                    // Drop focus before the native dialog opens; otherwise the
                    // Enter keystroke that confirms the file selection can leak
                    // back and re-activate this still-focused button.
                    e.currentTarget.blur();
                    fileRef.current?.click();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    addFiles(Array.from(e.dataTransfer.files));
                  }}
                  className={`w-full border-2 border-dashed ${isDragOver ? "border-[#1e4f86] bg-[#e0e7ff]/40" : imagesError ? "border-[#e7000b] bg-[#fafbfc]" : "border-[#e5e7eb] bg-[#fafbfc] hover:bg-[#f3f4f6]"} rounded-[10px] transition-colors flex flex-col items-center justify-center gap-3 py-10 text-center`}
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
                {!imagesError && totalImages === 0 && status !== PropertyStatus.DRAFT && (
                  <p className="text-[11px] text-amber-600" style={mont}>
                    At least one image is required to publish this listing. Add images or change status to Draft.
                  </p>
                )}
              </div>

              {existingImages.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-[12px] font-medium text-[#1f2937]" style={mont}>Current Images ({existingImages.length})</p>
                  <div className="grid grid-cols-4 gap-3">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative aspect-square rounded-[10px] overflow-hidden border border-[#e5e7eb] group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.altText ?? "Listing image"}
                          className="size-full object-cover cursor-pointer"
                          onClick={() => setCover({ existingId: image.id })}
                          title="Click to set as cover"
                        />
                        {isExistingCover(image.id) && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[6px] bg-[#1e4f86] text-white text-[10px] font-medium" style={mont}>Cover</span>
                        )}
                        <button
                          type="button"
                          title="Remove image"
                          onClick={() => removeExistingImage(image.id)}
                          disabled={isSubmitting}
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
                          onClick={() => setCover({ newIndex: i })}
                          title="Click to set as cover"
                        />
                        {i === newCoverIndex && (
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
                  <p className="text-[11px] text-[#9ca3af]" style={mont}>Click an image to mark it as the cover.</p>
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
              <button key="next-step" type="button" onClick={nextStep} className="h-10 px-5 bg-[#1e4f86] rounded-[10px] text-[12px] font-medium text-white hover:bg-[#1b487a] transition-colors" style={mont}>
                Next Step
              </button>
            ) : (
              <button
                key="save"
                type="button"
                onClick={() => {
                  // Swallow the tail of a double-click on "Next Step": this
                  // button takes its place in the footer the moment the step
                  // advances, so a click landing right after the swap is not
                  // an intentional save.
                  if (Date.now() - lastStepChangeAt.current < 400) return;
                  void onSubmit();
                }}
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
