"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
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
import { TYPE_LABELS, STATUS_LABELS } from "../listings-data";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const STEPS = ["Basic Info", "Listing Details", "Images"] as const;

const AMENITY_ICONS: Record<
  AmenityKey,
  ComponentType<{ size?: number; className?: string }>
> = {
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

type NewImage = {
  file: File;
  preview: string;
};

type CoverChoice =
  | { existingId: string }
  | { newIndex: number }
  | null;

type UploadListingModalProps = {
  onClose: () => void;
  listing?: DashboardListingDto;
  canFeature: boolean;
};

const inputClass =
  "h-11 w-full min-w-0 rounded-[10px] border bg-[#fafbfc] px-3.5 text-[14px] text-[#0d2138] outline-none transition-all placeholder:text-[#99a1af] focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:text-[#6a7282]";

const selectClass =
  "h-11 w-full min-w-0 cursor-pointer appearance-none rounded-[10px] border bg-[#fafbfc] pl-3.5 pr-10 text-[14px] text-[#0d2138] outline-none transition-all focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10";

const labelClass =
  "text-[14px] font-medium leading-5 text-[#1f2937]";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="text-[12px] leading-5 text-[#e7000b]"
      style={mont}
    >
      {message}
    </p>
  );
}

function borderClass(hasError: boolean) {
  return hasError ? "border-[#e7000b]" : "border-[#d7dde5]";
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-12 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 focus-visible:ring-offset-2 ${
        checked ? "bg-[#1e4f86]" : "bg-[#d1d5db]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18)] transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export function UploadListingModal({
  onClose,
  listing,
  canFeature,
}: UploadListingModalProps) {
  const isEdit = listing !== undefined;
  const titleId = useId();
  const descriptionId = useId();

  const [step, setStep] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const latestNewImagesRef = useRef<NewImage[]>([]);
  const lastStepChangeAt = useRef(0);

  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [cover, setCover] = useState<CoverChoice>(() => {
    const current = listing?.images.find((image) => image.isCover);
    return current ? { existingId: current.id } : null;
  });
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const createMutation = useCreateListingMutation();
  const updateMutation = useUpdateListingMutation();
  const addImagesMutation = useAddListingImagesMutation();
  const removeImageMutation = useRemoveListingImageMutation();
  const setCoverMutation = useSetListingCoverMutation();

  const [existingImages, setExistingImages] = useState(
    listing?.images ?? [],
  );
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
    resolver: zodResolver(
      createListingSchema,
    ) as unknown as Resolver<ListingFormValues>,
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

  useEffect(() => {
    latestNewImagesRef.current = newImages;
  }, [newImages]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isSubmitting, onClose]);

  useEffect(() => {
    return () => {
      latestNewImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.preview);
      });
    };
  }, []);

  function toggleOperation(operation: "Sale" | "Rent") {
    const next =
      operation === "Sale"
        ? hasSale
          ? hasRent
            ? PropertyOperationType.RENT
            : PropertyOperationType.SALE
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

    setValue("operationType", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function toggleAmenity(key: AmenityKey) {
    const next = amenities.includes(key)
      ? amenities.filter((item) => item !== key)
      : [...amenities, key];

    setValue("amenities", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    addFiles(files);
  }

  function addFiles(files: File[]) {
    if (files.length === 0) return;

    const totalCount =
      existingImages.length + newImages.length + files.length;

    if (totalCount > LISTING_IMAGE_MAX_COUNT) {
      setImagesError(
        `A listing can have at most ${LISTING_IMAGE_MAX_COUNT} images.`,
      );
      return;
    }

    for (const file of files) {
      const isAllowedType = LISTING_IMAGE_MIME_TYPES.some(
        (mimeType) => mimeType === file.type,
      );

      if (!isAllowedType) {
        setImagesError("Only JPG, PNG, and WebP images are allowed.");
        return;
      }

      if (file.size > LISTING_IMAGE_MAX_BYTES) {
        setImagesError(`"${file.name}" is larger than 10MB.`);
        return;
      }
    }

    setImagesError(null);
    setNewImages((current) => [
      ...current,
      ...files.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
  }

  function removeNewImage(index: number) {
    const selectedImage = newImages[index];
    if (!selectedImage) return;

    URL.revokeObjectURL(selectedImage.preview);

    setNewImages((current) =>
      current.filter((_, imageIndex) => imageIndex !== index),
    );

    setCover((currentCover) => {
      if (!currentCover || !("newIndex" in currentCover)) {
        return currentCover;
      }

      if (index === currentCover.newIndex) return null;

      return index < currentCover.newIndex
        ? { newIndex: currentCover.newIndex - 1 }
        : currentCover;
    });
  }

  function removeExistingImage(imageId: string) {
    setRemovedImageIds((current) =>
      current.includes(imageId) ? current : [...current, imageId],
    );

    setExistingImages((current) =>
      current.filter((image) => image.id !== imageId),
    );

    setCover((currentCover) =>
      currentCover &&
      "existingId" in currentCover &&
      currentCover.existingId === imageId
        ? null
        : currentCover,
    );

    setImagesError(null);
  }

  async function nextStep() {
    const fields = LISTING_STEP_FIELDS[step] as (
      | keyof ListingFormValues
    )[];
    const valid = await trigger(fields);

    if (!valid) return;

    lastStepChangeAt.current = Date.now();
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  function goToPreviousStep() {
    setStep((current) => Math.max(current - 1, 0));
  }

  const onSubmit = handleSubmit(async (values) => {
    const totalImages = existingImages.length + newImages.length;

    if (totalImages === 0 && values.status !== PropertyStatus.DRAFT) {
      setImagesError("At least one image is required to publish a listing.");
      setStep(2);
      return;
    }

    const payload = createListingSchema.parse(values);

    try {
      if (isEdit && listing) {
        await updateMutation.mutateAsync({
          id: listing.id,
          data: payload,
        });

        let addedImages: { id: string; sortOrder: number }[] = [];

        if (newImages.length > 0) {
          const result = await addImagesMutation.mutateAsync({
            id: listing.id,
            images: newImages.map((image) => image.file),
          });

          addedImages = [...result.listing.images]
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .slice(-newImages.length);
        }

        for (const imageId of removedImageIds) {
          await removeImageMutation.mutateAsync({
            id: listing.id,
            imageId,
          });
        }

        const originalCoverId = listing.images.find(
          (image) => image.isCover,
        )?.id;

        const desiredCoverId =
          cover && "existingId" in cover
            ? cover.existingId !== originalCoverId
              ? cover.existingId
              : undefined
            : cover
              ? addedImages[cover.newIndex]?.id
              : undefined;

        if (desiredCoverId) {
          await setCoverMutation.mutateAsync({
            id: listing.id,
            imageId: desiredCoverId,
          });
        }

        toast.success("Listing updated");
      } else {
        await createMutation.mutateAsync({
          data: payload,
          images: newImages.map((image) => image.file),
          coverIndex: cover && "newIndex" in cover ? cover.newIndex : 0,
        });

        toast.success("Listing created");
      }

      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  });

  const stepHasErrors = useMemo(
    () =>
      (LISTING_STEP_FIELDS[step] ?? []).some(
        (field) => field in errors,
      ),
    [errors, step],
  );

  const isExistingCover = (id: string) =>
    cover !== null &&
    "existingId" in cover &&
    cover.existingId === id;

  const newCoverIndex =
    cover === null
      ? isEdit
        ? -1
        : 0
      : "newIndex" in cover
        ? cover.newIndex
        : -1;

  function handleBackdropMouseDown(
    event: ReactMouseEvent<HTMLDivElement>,
  ) {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative flex max-h-[calc(100dvh-16px)] w-full max-w-[850px] flex-col overflow-hidden rounded-[14px] border border-white/20 bg-white shadow-2xl sm:max-h-[92dvh]"
      >
        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#e5e7eb] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-[18px] font-semibold leading-7 text-[#0d2138] sm:text-[20px]"
              style={mont}
            >
              {isEdit ? "Edit Listing" : "Upload New Listing"}
            </h2>

            <p
              id={descriptionId}
              className="mt-0.5 text-[14px] leading-5 text-[#6a7282]"
              style={mont}
            >
              Step {step + 1} of {STEPS.length}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close listing modal"
            className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </header>

        {/* Stepper */}
        <div className="shrink-0 border-b border-[#f3f4f6] bg-white px-4 py-4 sm:px-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {STEPS.map((label, index) => {
              const isComplete = index < step;
              const isCurrent = index === step;
              const isReachable = index <= step;

              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (index < step) setStep(index);
                  }}
                  disabled={!isReachable || isSubmitting}
                  aria-current={isCurrent ? "step" : undefined}
                  className="min-w-0 text-left disabled:cursor-default"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-colors ${
                      isComplete || isCurrent
                        ? "bg-[#1e4f86]"
                        : "bg-[#e5e7eb]"
                    }`}
                  />

                  <span
                    className={`mt-2 block truncate text-[12px] font-medium sm:text-[14px] ${
                      isComplete || isCurrent
                        ? "text-[#1e4f86]"
                        : "text-[#99a1af]"
                    }`}
                    style={mont}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={handleFormSubmit}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.target as HTMLElement).tagName === "INPUT"
            ) {
              event.preventDefault();
            }
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-5 sm:gap-6">
              {/* Step 1: Basic Info */}
              {step === 0 && (
                <>
                  <div className="flex min-w-0 flex-col gap-2">
                    <label
                      htmlFor="listing-title"
                      className={labelClass}
                      style={mont}
                    >
                      Listing Name <span className="text-[#e7000b]">*</span>
                    </label>

                    <input
                      id="listing-title"
                      {...register("title")}
                      placeholder="e.g., Modern Downtown Apartment"
                      className={`${inputClass} ${borderClass(
                        Boolean(errors.title),
                      )}`}
                      style={mont}
                    />

                    <FieldError message={errors.title?.message} />
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    <div className="flex min-w-0 flex-col gap-2">
                      <label
                        htmlFor="listing-type"
                        className={labelClass}
                        style={mont}
                      >
                        Listing Type <span className="text-[#e7000b]">*</span>
                      </label>

                      <div className="relative min-w-0">
                        <select
                          id="listing-type"
                          {...register("type")}
                          className={`${selectClass} ${borderClass(
                            Boolean(errors.type),
                          )}`}
                          style={mont}
                        >
                          {Object.entries(TYPE_LABELS).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>

                        <ChevronDown
                          size={18}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282]"
                        />
                      </div>

                      <FieldError message={errors.type?.message} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-2">
                      <label
                        htmlFor="listing-status"
                        className={labelClass}
                        style={mont}
                      >
                        Status <span className="text-[#e7000b]">*</span>
                      </label>

                      <div className="relative min-w-0">
                        <select
                          id="listing-status"
                          {...register("status")}
                          className={`${selectClass} ${borderClass(
                            Boolean(errors.status),
                          )}`}
                          style={mont}
                        >
                          {Object.entries(STATUS_LABELS).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>

                        <ChevronDown
                          size={18}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6a7282]"
                        />
                      </div>

                      <FieldError message={errors.status?.message} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className={labelClass} style={mont}>
                      Operation Type <span className="text-[#e7000b]">*</span>
                    </span>

                    <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                      {(["Sale", "Rent"] as const).map((operation) => {
                        const isActive =
                          operation === "Sale" ? hasSale : hasRent;

                        return (
                          <button
                            key={operation}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => toggleOperation(operation)}
                            className={`h-11 rounded-[10px] border px-5 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 ${
                              isActive
                                ? "border-[#1e4f86] bg-[#1e4f86] text-white"
                                : "border-[#d7dde5] bg-white text-[#1f2937] hover:bg-[#f9fafb]"
                            }`}
                            style={mont}
                          >
                            {operation}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className={
                      hasSale && hasRent
                        ? "grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5"
                        : ""
                    }
                  >
                    {hasSale && (
                      <div className="flex min-w-0 flex-col gap-2">
                        <label
                          htmlFor="listing-sale-price"
                          className={labelClass}
                          style={mont}
                        >
                          Sale Price <span className="text-[#e7000b]">*</span>
                        </label>

                        <input
                          id="listing-sale-price"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          {...register("salePrice")}
                          placeholder="450000"
                          className={`${inputClass} ${borderClass(
                            Boolean(errors.salePrice),
                          )}`}
                          style={mont}
                        />

                        <FieldError message={errors.salePrice?.message} />
                      </div>
                    )}

                    {hasRent && (
                      <div className="flex min-w-0 flex-col gap-2">
                        <label
                          htmlFor="listing-rent-price"
                          className={labelClass}
                          style={mont}
                        >
                          Rent Price <span className="text-[#e7000b]">*</span>
                        </label>

                        <input
                          id="listing-rent-price"
                          type="number"
                          min="0"
                          inputMode="decimal"
                          {...register("rentPrice")}
                          placeholder="1200"
                          className={`${inputClass} ${borderClass(
                            Boolean(errors.rentPrice),
                          )}`}
                          style={mont}
                        />

                        <FieldError message={errors.rentPrice?.message} />
                      </div>
                    )}
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    <div className="flex min-w-0 flex-col gap-2">
                      <label
                        htmlFor="listing-location"
                        className={labelClass}
                        style={mont}
                      >
                        Location <span className="text-[#e7000b]">*</span>
                      </label>

                      <input
                        id="listing-location"
                        {...register("location")}
                        placeholder="Buenos Aires, Argentina"
                        className={`${inputClass} ${borderClass(
                          Boolean(errors.location),
                        )}`}
                        style={mont}
                      />

                      <FieldError message={errors.location?.message} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-2">
                      <label
                        htmlFor="listing-full-address"
                        className={labelClass}
                        style={mont}
                      >
                        Full Address <span className="text-[#e7000b]">*</span>
                      </label>

                      <input
                        id="listing-full-address"
                        {...register("fullAddress")}
                        placeholder="1234 Main Street, Downtown"
                        className={`${inputClass} ${borderClass(
                          Boolean(errors.fullAddress),
                        )}`}
                        style={mont}
                      />

                      <FieldError message={errors.fullAddress?.message} />
                    </div>
                  </div>

                  {canFeature && (
                    <div className="flex min-w-0 items-start justify-between gap-4 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4 sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[14px] font-semibold leading-5 text-[#1f2937]"
                          style={mont}
                        >
                          Featured listing
                        </p>

                        <p
                          className="mt-1 text-[14px] leading-5 text-[#6a7282]"
                          style={mont}
                        >
                          Highlight this property at the top of listings.
                        </p>
                      </div>

                      <Toggle
                        checked={isFeatured}
                        onChange={(value) =>
                          setValue("isFeatured", value, {
                            shouldDirty: true,
                          })
                        }
                        label="Featured listing"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Listing Details */}
              {step === 1 && (
                <>
                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                    {(
                      [
                        ["bedrooms", "Bedrooms", "3"],
                        ["bathrooms", "Bathrooms", "2"],
                        ["areaSqft", "Area (sqft)", "1200"],
                      ] as const
                    ).map(([field, label, placeholder]) => (
                      <div
                        key={field}
                        className="flex min-w-0 flex-col gap-2"
                      >
                        <label
                          htmlFor={`listing-${field}`}
                          className={labelClass}
                          style={mont}
                        >
                          {label} <span className="text-[#e7000b]">*</span>
                        </label>

                        <input
                          id={`listing-${field}`}
                          type="number"
                          min="0"
                          inputMode="numeric"
                          {...register(field)}
                          placeholder={placeholder}
                          className={`${inputClass} ${borderClass(
                            Boolean(errors[field]),
                          )}`}
                          style={mont}
                        />

                        <FieldError message={errors[field]?.message} />
                      </div>
                    ))}
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    <div className="flex min-w-0 flex-col gap-2">
                      <label
                        htmlFor="listing-year-built"
                        className={labelClass}
                        style={mont}
                      >
                        Year Built <span className="text-[#e7000b]">*</span>
                      </label>

                      <input
                        id="listing-year-built"
                        type="number"
                        min="1800"
                        inputMode="numeric"
                        {...register("yearBuilt")}
                        placeholder="2020"
                        className={`${inputClass} ${borderClass(
                          Boolean(errors.yearBuilt),
                        )}`}
                        style={mont}
                      />

                      <FieldError message={errors.yearBuilt?.message} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-2">
                      <label
                        htmlFor="listing-toilets"
                        className={labelClass}
                        style={mont}
                      >
                        Toilets <span className="text-[#e7000b]">*</span>
                      </label>

                      <input
                        id="listing-toilets"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        {...register("toilets")}
                        placeholder="2"
                        className={`${inputClass} ${borderClass(
                          Boolean(errors.toilets),
                        )}`}
                        style={mont}
                      />

                      <FieldError message={errors.toilets?.message} />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label
                      htmlFor="listing-description"
                      className={labelClass}
                      style={mont}
                    >
                      Description <span className="text-[#e7000b]">*</span>
                    </label>

                    <textarea
                      id="listing-description"
                      {...register("description")}
                      placeholder="Describe the listing, its features, and unique selling points..."
                      rows={5}
                      className={`min-h-[130px] w-full min-w-0 resize-y rounded-[10px] border bg-[#fafbfc] px-3.5 py-3 text-[14px] leading-6 text-[#0d2138] outline-none transition-all placeholder:text-[#99a1af] focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 ${borderClass(
                        Boolean(errors.description),
                      )}`}
                      style={mont}
                    />

                    <FieldError message={errors.description?.message} />
                  </div>

                  <div className="flex min-w-0 flex-col gap-3">
                    <span className={labelClass} style={mont}>
                      Features &amp; Amenities
                    </span>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {AMENITY_OPTIONS.map(({ key, label }) => {
                        const Icon = AMENITY_ICONS[key];
                        const isActive = amenities.includes(key);

                        return (
                          <button
                            key={key}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => toggleAmenity(key)}
                            className={`flex min-h-12 min-w-0 items-center gap-2.5 rounded-[10px] border px-3 text-left text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 sm:px-4 ${
                              isActive
                                ? "border-[#1e4f86] bg-[#eff6ff] font-medium text-[#1e4f86]"
                                : "border-[#e5e7eb] bg-[#fafbfc] text-[#6a7282] hover:bg-[#f3f4f6]"
                            }`}
                            style={mont}
                          >
                            <Icon
                              size={17}
                              className={`shrink-0 ${
                                isActive
                                  ? "text-[#1e4f86]"
                                  : "text-[#99a1af]"
                              }`}
                            />

                            <span className="min-w-0 break-words leading-5">
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Images */}
              {step === 2 && (
                <>
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className={labelClass} style={mont}>
                      Listing Images <span className="text-[#e7000b]">*</span>
                    </label>

                    <input
                      ref={fileRef}
                      type="file"
                      accept={LISTING_IMAGE_MIME_TYPES.join(",")}
                      multiple
                      className="hidden"
                      onChange={handleFiles}
                    />

                    <button
                      type="button"
                      onClick={(event) => {
                        event.currentTarget.blur();
                        fileRef.current?.click();
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setIsDragOver(false);
                        addFiles(Array.from(event.dataTransfer.files));
                      }}
                      className={`flex w-full flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed px-4 py-8 text-center transition-colors sm:py-10 ${
                        isDragOver
                          ? "border-[#1e4f86] bg-[#e0e7ff]/40"
                          : imagesError
                            ? "border-[#e7000b] bg-[#fffafa]"
                            : "border-[#d7dde5] bg-[#fafbfc] hover:bg-[#f3f4f6]"
                      }`}
                    >
                      <span className="flex size-12 items-center justify-center rounded-full bg-[#e0e7ff]">
                        <Upload size={22} className="text-[#1e4f86]" />
                      </span>

                      <div className="flex flex-col gap-1">
                        <p
                          className="text-[16px] font-semibold leading-6 text-[#0d2138]"
                          style={mont}
                        >
                          Upload Listing Images
                        </p>

                        <p
                          className="text-[14px] leading-5 text-[#6a7282]"
                          style={mont}
                        >
                          Drag and drop images here, or click to browse.
                        </p>
                      </div>

                      <span
                        className="inline-flex h-10 items-center justify-center rounded-[9px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white"
                        style={mont}
                      >
                        Choose Files
                      </span>

                      <p
                        className="text-[12px] leading-5 text-[#9ca3af]"
                        style={mont}
                      >
                        JPG, PNG or WebP. Maximum 10MB per image.
                      </p>
                    </button>

                    <FieldError message={imagesError ?? undefined} />
                  </div>

                  {existingImages.length > 0 && (
                    <div className="flex min-w-0 flex-col gap-3">
                      <p
                        className="text-[14px] font-medium text-[#1f2937]"
                        style={mont}
                      >
                        Current Images ({existingImages.length})
                      </p>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {existingImages.map((image) => (
                          <div
                            key={image.id}
                            className={`group relative aspect-square overflow-hidden rounded-[10px] border bg-[#f3f4f6] ${
                              isExistingCover(image.id)
                                ? "border-[#1e4f86] ring-2 ring-[#1e4f86]/15"
                                : "border-[#e5e7eb]"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.url}
                              alt={image.altText ?? "Listing image"}
                              className="size-full cursor-pointer object-cover"
                              onClick={() =>
                                setCover({ existingId: image.id })
                              }
                              title="Click to set as cover"
                            />

                            {isExistingCover(image.id) && (
                              <span
                                className="absolute left-2 top-2 rounded-[6px] bg-[#1e4f86] px-2 py-1 text-[11px] font-medium text-white"
                                style={mont}
                              >
                                Cover
                              </span>
                            )}

                            <button
                              type="button"
                              title="Remove image"
                              aria-label="Remove image"
                              onClick={() => removeExistingImage(image.id)}
                              disabled={isSubmitting}
                              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {newImages.length > 0 && (
                    <div className="flex min-w-0 flex-col gap-3">
                      <p
                        className="text-[14px] font-medium text-[#1f2937]"
                        style={mont}
                      >
                        {isEdit
                          ? `New Images (${newImages.length})`
                          : `Uploaded Images (${newImages.length})`}
                      </p>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {newImages.map((image, index) => (
                          <div
                            key={image.preview}
                            className={`group relative aspect-square overflow-hidden rounded-[10px] border bg-[#f3f4f6] ${
                              index === newCoverIndex
                                ? "border-[#1e4f86] ring-2 ring-[#1e4f86]/15"
                                : "border-[#e5e7eb]"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.preview}
                              alt={`Upload ${index + 1}`}
                              className="size-full cursor-pointer object-cover"
                              onClick={() => setCover({ newIndex: index })}
                              title="Click to set as cover"
                            />

                            {index === newCoverIndex && (
                              <span
                                className="absolute left-2 top-2 rounded-[6px] bg-[#1e4f86] px-2 py-1 text-[11px] font-medium text-white"
                                style={mont}
                              >
                                Cover
                              </span>
                            )}

                            <button
                              type="button"
                              title="Remove image"
                              aria-label={`Remove upload ${index + 1}`}
                              onClick={() => removeNewImage(index)}
                              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <p
                        className="text-[12px] leading-5 text-[#9ca3af]"
                        style={mont}
                      >
                        Click an image to mark it as the cover.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="shrink-0 border-t border-[#e5e7eb] bg-white px-4 py-4 sm:px-6">
            {stepHasErrors && (
              <p
                className="mb-3 text-[12px] leading-5 text-[#e7000b] sm:text-right"
                style={mont}
              >
                Please fix the highlighted fields.
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={goToPreviousStep}
                    disabled={isSubmitting}
                    className="inline-flex h-11 items-center justify-center rounded-[10px] border border-[#d7dde5] bg-white px-4 text-[14px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/25 disabled:cursor-not-allowed disabled:opacity-50"
                    style={mont}
                  >
                    Previous
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={`inline-flex h-11 items-center justify-center rounded-[10px] border border-[#d7dde5] bg-white px-4 text-[14px] font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/25 disabled:cursor-not-allowed disabled:opacity-50 ${
                    step === 0 ? "col-span-2 sm:col-span-1" : ""
                  }`}
                  style={mont}
                >
                  Cancel
                </button>
              </div>

              {step < STEPS.length - 1 ? (
                <button
                  key="next-step"
                  type="button"
                  onClick={nextStep}
                  disabled={isSubmitting}
                  className="inline-flex h-11 w-full items-center justify-center rounded-[10px] bg-[#1e4f86] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#1b487a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  style={mont}
                >
                  Next Step
                </button>
              ) : (
                <button
                  key="save"
                  type="button"
                  onClick={() => {
                    if (Date.now() - lastStepChangeAt.current < 400) return;
                    void onSubmit();
                  }}
                  disabled={isSubmitting}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-[#1e4f86] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-[#1b487a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  style={mont}
                >
                  {isSubmitting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}

                  {isSubmitting
                    ? "Saving..."
                    : isEdit
                      ? "Save Changes"
                      : "Submit"}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}