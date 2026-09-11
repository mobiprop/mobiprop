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
import { ZodError } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useDragReorder } from "@/hooks/useDragReorder";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
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
  Thermometer,
  Rows3,
  FlameKindling,
  Flag,
  Target,
  DoorOpen,
  Grid3x3,
  Wind,
  Armchair,
  Utensils,
  Umbrella,
  Briefcase,
  Users,
  Shirt,
  BedDouble,
  Sun,
} from "lucide-react";

import {
  PropertyOperationType,
  PropertyStatus,
  PropertyType,
  ContactType,
  Currency,
} from "@/generated/prisma/enums";
import type { ContactDto } from "@/features/crm/types/crm-dto";
import { QuickAddContactModal } from "./QuickAddContactModal";
import { EditLocationModal } from "./EditLocationModal";
import { SearchableSelect } from "./SearchableSelect";
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
import { useCreateLocationMutation } from "@/hooks/mutations/useLocationMutations";
import {
  useUpdateListingMutation,
  useAddListingImagesMutation,
  useRemoveListingImageMutation,
  useSetListingCoverMutation,
  useReorderListingImagesMutation,
} from "@/hooks/mutations/useUpdateListingMutation";
import type { DashboardListingDto } from "@/features/listings/types/listing-dto";
import type { ListingInput, UpdateListingInput } from "@/schemas/listing.schema";
import { LocationPickerInput } from "./LocationPickerInput";
import { PlaceAutocompleteInput } from "@/components/maps/PlaceAutocompleteInput";

const mont = { fontFamily: "'Montserrat', sans-serif" };

const MAX_IMAGE_MB = Math.round(LISTING_IMAGE_MAX_BYTES / (1024 * 1024));

// Displayed labels are translated via t(`uploadModal.steps.${key}`); these
// identifiers stay in stable English because they're used for step indexing.
const STEPS = ["basicInfo", "listingDetails", "features", "images"] as const;

type AreaField = {
  key: "totalAreaM2" | "coveredAreaM2" | "semiCoveredAreaM2" | "lotSizeM2" | "lotFrontageM2" | "lotDepthM2";
  labelKey: string;
  placeholder: string;
  required: boolean;
};

// Non-LOT listings break area into total/covered/semi-covered + optional lot
// size; LOT listings replace all of that with frontage/depth instead.
const NON_LOT_AREA_FIELDS: AreaField[] = [
  { key: "totalAreaM2", labelKey: "uploadModal.areaLabels.total", placeholder: "120", required: true },
  { key: "coveredAreaM2", labelKey: "uploadModal.areaLabels.covered", placeholder: "95", required: false },
  { key: "semiCoveredAreaM2", labelKey: "uploadModal.areaLabels.semiCovered", placeholder: "15", required: false },
  { key: "lotSizeM2", labelKey: "uploadModal.areaLabels.lotSize", placeholder: "200", required: false },
];

const LOT_AREA_FIELDS: AreaField[] = [
  { key: "totalAreaM2", labelKey: "uploadModal.areaLabels.total", placeholder: "500", required: true },
  { key: "lotFrontageM2", labelKey: "uploadModal.areaLabels.lotFrontage", placeholder: "20", required: false },
  { key: "lotDepthM2", labelKey: "uploadModal.areaLabels.lotDepth", placeholder: "25", required: false },
];

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
  CENTRAL_HEATING: Thermometer,
  RADIATORS: Rows3,
  BALANCED_FLUE_GAS_HEATER: FlameKindling,
  POLO_FIELD: Flag,
  GOLF_COURSE: Target,
  MULTIPURPOSE_ROOM: DoorOpen,
  PADEL_COURT: Grid3x3,
  CENTRAL_AIR_CONDITIONING: Wind,
  LIVING_ROOM: Armchair,
  LIVING_DINING_ROOM: Utensils,
  COVERED_ENTERTAINING_AREA: Umbrella,
  APPROVED_FOR_PROFESSIONAL_USE: Briefcase,
  STAFF_QUARTERS: Users,
  WALK_IN_CLOSET: Shirt,
  EN_SUITE_BEDROOM: BedDouble,
  SOLARIUM: Sun,
};

// Order + section titles for the Features step's 3 grouped subsections
// (client's explicit grouping, replacing the single "Features & Amenities"
// heading).
const AMENITY_GROUP_ORDER = ["PROPERTY", "EQUIPMENT", "AMENITIES_EXTERIOR"] as const;
const AMENITY_GROUP_TITLE_KEY: Record<(typeof AMENITY_GROUP_ORDER)[number], string> = {
  PROPERTY: "uploadModal.fields.featureGroups.property",
  EQUIPMENT: "uploadModal.fields.featureGroups.equipment",
  AMENITIES_EXTERIOR: "uploadModal.fields.featureGroups.amenitiesExterior",
};

type ListingFormValues = {
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  operationType: PropertyOperationType;
  salePrice: string;
  rentPrice: string;
  saleCurrency: Currency;
  rentCurrency: Currency;
  locationId: string;
  location: string;
  fullAddress: string;
  isFeatured: boolean;
  assignedAgentId: string;
  ownerContactId: string;
  videoUrl: string;
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  totalAreaM2: string;
  coveredAreaM2: string;
  semiCoveredAreaM2: string;
  lotSizeM2: string;
  lotFrontageM2: string;
  lotDepthM2: string;
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
  saleCurrency: Currency.USD,
  rentCurrency: Currency.USD,
  locationId: "",
  location: "",
  fullAddress: "",
  isFeatured: false,
  assignedAgentId: "",
  ownerContactId: "",
  videoUrl: "",
  bedrooms: "",
  bathrooms: "",
  toilets: "",
  totalAreaM2: "",
  coveredAreaM2: "",
  semiCoveredAreaM2: "",
  lotSizeM2: "",
  lotFrontageM2: "",
  lotDepthM2: "",
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
    saleCurrency: listing.saleCurrency,
    rentCurrency: listing.rentCurrency,
    locationId: listing.locationId ?? "",
    location: listing.location,
    fullAddress: listing.fullAddress,
    isFeatured: listing.isFeatured,
    assignedAgentId: listing.assignedAgentId ?? "",
    ownerContactId: listing.ownerContact?.id ?? "",
    videoUrl: listing.videoUrl ?? "",
    bedrooms: listing.bedrooms?.toString() ?? "",
    bathrooms: listing.bathrooms?.toString() ?? "",
    toilets: listing.toilets?.toString() ?? "",
    totalAreaM2: listing.totalAreaM2?.toString() ?? "",
    coveredAreaM2: listing.coveredAreaM2?.toString() ?? "",
    semiCoveredAreaM2: listing.semiCoveredAreaM2?.toString() ?? "",
    lotSizeM2: listing.lotSizeM2?.toString() ?? "",
    lotFrontageM2: listing.lotFrontageM2?.toString() ?? "",
    lotDepthM2: listing.lotDepthM2?.toString() ?? "",
    yearBuilt: listing.yearBuilt?.toString() ?? "",
    description: listing.description,
    amenities: listing.amenities,
  };
}

type AssignableAgent = { id: string; name: string; status: string };

type SellerContact = { id: string; fullName: string; contactId: string };

type NewImage = {
  file: File;
  preview: string;
};

type CoverChoice =
  | { existingId: string }
  | { newKey: string }
  | null;

/** Moves the item at `from` to `to`, shifting everything in between. */
function reorderArray<T>(array: T[], from: number, to: number): T[] {
  const next = [...array];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

type UploadListingModalProps = {
  onClose: () => void;
  listing?: DashboardListingDto;
  canFeature: boolean;
  /** listings:assign — ADMIN/MANAGER only. Hides the Assigned Agent field otherwise. */
  canAssign: boolean;
};

/**
 * Returns only the fields that changed vs the saved listing.
 * Sending a minimal diff avoids unnecessary DB writes and geocode calls.
 * When operationType changes we always include both prices so the server's
 * conditional price validation has them available — and explicitly null out
 * whichever price the new operation type no longer needs (rather than
 * silently keeping the old value from a since-hidden, still-registered
 * form field).
 */
function buildUpdateDiff(listing: DashboardListingDto, parsed: ListingInput): Partial<UpdateListingInput> {
  const diff: Partial<UpdateListingInput> = {};

  if (parsed.title !== listing.title) diff.title = parsed.title;
  if (parsed.type !== listing.type) diff.type = parsed.type;
  if (parsed.status !== listing.status) diff.status = parsed.status;
  if (parsed.operationType !== listing.operationType) diff.operationType = parsed.operationType;
  if (parsed.salePrice !== (listing.salePrice ?? undefined)) diff.salePrice = parsed.salePrice;
  if (parsed.rentPrice !== (listing.rentPrice ?? undefined)) diff.rentPrice = parsed.rentPrice;
  if (parsed.saleCurrency !== listing.saleCurrency) diff.saleCurrency = parsed.saleCurrency;
  if (parsed.rentCurrency !== listing.rentCurrency) diff.rentCurrency = parsed.rentCurrency;
  if (parsed.locationId !== (listing.locationId ?? "")) diff.locationId = parsed.locationId;
  if (parsed.location !== listing.location) diff.location = parsed.location;
  if (parsed.fullAddress !== listing.fullAddress) diff.fullAddress = parsed.fullAddress;
  if (parsed.isFeatured !== listing.isFeatured) diff.isFeatured = parsed.isFeatured;
  if ((parsed.assignedAgentId ?? "") !== (listing.assignedAgentId ?? "")) {
    diff.assignedAgentId = parsed.assignedAgentId;
  }
  if ((parsed.ownerContactId ?? "") !== (listing.ownerContact?.id ?? "")) {
    diff.ownerContactId = parsed.ownerContactId;
  }
  if ((parsed.videoUrl ?? "") !== (listing.videoUrl ?? "")) {
    diff.videoUrl = parsed.videoUrl;
  }
  if (parsed.bedrooms !== (listing.bedrooms ?? undefined)) diff.bedrooms = parsed.bedrooms;
  if (parsed.bathrooms !== (listing.bathrooms ?? undefined)) diff.bathrooms = parsed.bathrooms;
  if (parsed.toilets !== (listing.toilets ?? undefined)) diff.toilets = parsed.toilets;
  if (parsed.totalAreaM2 !== (listing.totalAreaM2 ?? undefined)) diff.totalAreaM2 = parsed.totalAreaM2;
  if (parsed.coveredAreaM2 !== (listing.coveredAreaM2 ?? undefined))
    diff.coveredAreaM2 = parsed.coveredAreaM2;
  if (parsed.semiCoveredAreaM2 !== (listing.semiCoveredAreaM2 ?? undefined))
    diff.semiCoveredAreaM2 = parsed.semiCoveredAreaM2;
  if (parsed.lotSizeM2 !== (listing.lotSizeM2 ?? undefined)) diff.lotSizeM2 = parsed.lotSizeM2;
  if (parsed.lotFrontageM2 !== (listing.lotFrontageM2 ?? undefined))
    diff.lotFrontageM2 = parsed.lotFrontageM2;
  if (parsed.lotDepthM2 !== (listing.lotDepthM2 ?? undefined)) diff.lotDepthM2 = parsed.lotDepthM2;
  if (parsed.yearBuilt !== (listing.yearBuilt ?? undefined)) diff.yearBuilt = parsed.yearBuilt;
  if (parsed.description !== listing.description) diff.description = parsed.description;

  // operationType change: always include both prices (and their currencies)
  // so the server's conditional price validation (requires relevant prices)
  // can run. Explicitly null out whichever price the new operation type no
  // longer needs — its form field is now hidden but still registered, so it
  // can otherwise hold a stale leftover value from before the toggle.
  if (diff.operationType !== undefined) {
    const needsSale =
      parsed.operationType === PropertyOperationType.SALE ||
      parsed.operationType === PropertyOperationType.SALE_AND_RENT;
    const needsRent =
      parsed.operationType === PropertyOperationType.RENT ||
      parsed.operationType === PropertyOperationType.SALE_AND_RENT;

    diff.salePrice = needsSale ? parsed.salePrice : null;
    diff.rentPrice = needsRent ? parsed.rentPrice : null;
    diff.saleCurrency = parsed.saleCurrency;
    diff.rentCurrency = parsed.rentCurrency;
  }

  const origAmenities = [...listing.amenities].sort().join(",");
  const newAmenities = [...parsed.amenities].sort().join(",");
  if (origAmenities !== newAmenities) diff.amenities = parsed.amenities;

  return diff;
}

const inputClass =
  "h-11 w-full min-w-0 rounded-[10px] border bg-[#fafbfc] px-3.5 text-[14px] text-[#0d2138] outline-none transition-all placeholder:text-[#99a1af] focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:text-[#6a7282]";

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

/** Compact inline USD/ARS toggle — one per price field, since sale and rent can differ. */
function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (next: Currency) => void;
}) {
  return (
    <div className="flex shrink-0 rounded-lg border border-[#d7dde5] p-0.5">
      {Object.values(Currency).map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
            value === c ? "bg-[#1e4f86] text-white" : "text-[#6a7282] hover:bg-[#f3f4f6]"
          }`}
          style={mont}
        >
          {c}
        </button>
      ))}
    </div>
  );
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
  canAssign,
}: UploadListingModalProps) {
  const { t } = useTranslation("dashboardListings");
  const { t: td } = useTranslation("dashboard");
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
  const [agents, setAgents] = useState<AssignableAgent[]>([]);
  const [sellerContacts, setSellerContacts] = useState<SellerContact[]>([]);
  const [showAddOwnerContact, setShowAddOwnerContact] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(true);

  useEffect(() => {
    if (!canAssign) {
      setAgentsLoading(false);
      return;
    }
    fetch("/api/dashboard/agents")
      .then((res) => res.json())
      .then((json) => setAgents((json.agents ?? []).filter((a: AssignableAgent) => a.status === "ACTIVE")))
      .catch(() => undefined)
      .finally(() => setAgentsLoading(false));
  }, [canAssign]);

  useEffect(() => {
    fetch("/api/dashboard/contacts")
      .then((res) => res.json())
      .then((json) => {
        const contacts: ContactDto[] = json.contacts ?? [];
        setSellerContacts(
          contacts
            .filter((c) => c.roles.includes(ContactType.SELLER))
            .map((c) => ({ id: c.id, fullName: c.fullName, contactId: c.contactId })),
        );
      })
      .catch(() => undefined)
      .finally(() => setContactsLoading(false));
  }, []);

  const createMutation = useCreateListingMutation();
  const updateMutation = useUpdateListingMutation();
  const createLocationMutation = useCreateLocationMutation();
  const addImagesMutation = useAddListingImagesMutation();
  const removeImageMutation = useRemoveListingImageMutation();
  const setCoverMutation = useSetListingCoverMutation();
  const reorderImagesMutation = useReorderListingImagesMutation();

  const [existingImages, setExistingImages] = useState(
    listing?.images ?? [],
  );
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const initialExistingOrderRef = useRef(
    (listing?.images ?? []).map((image) => image.id),
  );
  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    addImagesMutation.isPending ||
    removeImageMutation.isPending ||
    setCoverMutation.isPending ||
    reorderImagesMutation.isPending;

  // Pointer-based so reordering works by touch on phones/iPads too — the
  // HTML5 drag events this replaces only ever fired for a mouse.
  const existingDrag = useDragReorder({
    disabled: isSubmitting,
    onReorder: (from, to) => setExistingImages((current) => reorderArray(current, from, to)),
  });
  const newDrag = useDragReorder({
    disabled: isSubmitting,
    onReorder: (from, to) => setNewImages((current) => reorderArray(current, from, to)),
  });

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
  const type = watch("type");
  const status = watch("status");
  const saleCurrency = watch("saleCurrency");
  const rentCurrency = watch("rentCurrency");
  const locationId = watch("locationId");
  const fullAddress = watch("fullAddress");
  const assignedAgentId = watch("assignedAgentId");
  const ownerContactId = watch("ownerContactId");

  const totalImages = existingImages.length + newImages.length;
  const areaFields = type === PropertyType.LOT ? LOT_AREA_FIELDS : NON_LOT_AREA_FIELDS;

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
        t("uploadModal.errors.tooManyImages", { max: LISTING_IMAGE_MAX_COUNT }),
      );
      return;
    }

    for (const file of files) {
      const isAllowedType = LISTING_IMAGE_MIME_TYPES.some(
        (mimeType) => mimeType === file.type,
      );

      if (!isAllowedType) {
        setImagesError(t("uploadModal.errors.invalidImageType"));
        return;
      }

      if (file.size > LISTING_IMAGE_MAX_BYTES) {
        setImagesError(t("uploadModal.errors.imageTooLarge", { name: file.name, maxMb: MAX_IMAGE_MB }));
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

    setCover((currentCover) =>
      currentCover &&
      "newKey" in currentCover &&
      currentCover.newKey === selectedImage.preview
        ? null
        : currentCover,
    );
  }

  function moveExistingImage(index: number, direction: -1 | 1) {
    setExistingImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      return reorderArray(current, index, target);
    });
  }

  function moveNewImage(index: number, direction: -1 | 1) {
    setNewImages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      return reorderArray(current, index, target);
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
    if (totalImages === 0 && values.status !== PropertyStatus.DRAFT) {
      setImagesError(t("uploadModal.errors.atLeastOneImageToPublish"));
      setStep(2);
      return;
    }

    // The mutations resize + convert each image to WebP in the browser and
    // upload it straight to storage via signed URLs, then send only small JSON
    // to the API — so there's no request-body size limit on the upload.
    const newFiles = newImages.map((i) => i.file);

    try {
      // Parse again after resolver to get coerced (numeric) values. Runs
      // inside the try so a mismatch here surfaces as a toast instead of an
      // unhandled promise rejection with no user-visible feedback.
      const parsed = createListingSchema.parse(values);

      if (isEdit && listing) {
        const diff = buildUpdateDiff(listing, parsed);
        const hasFieldChanges = Object.keys(diff).length > 0;

        // Phase 1 — field update and image upload are independent: run in
        // parallel. Add new images before removing so the listing never dips
        // below 1 image.
        const [, addResult] = await Promise.all([
          hasFieldChanges
            ? updateMutation.mutateAsync({ id: listing.id, data: diff })
            : Promise.resolve(null),
          newFiles.length > 0
            ? addImagesMutation.mutateAsync({ id: listing.id, images: newFiles })
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

        // Phase 2b — persist reordering of existing images. Runs after removals
        // since the reorder endpoint requires the id list to exactly match what
        // remains on the listing.
        const currentExistingOrder = existingImages.map((image) => image.id);
        const survivingInitialOrder = initialExistingOrderRef.current.filter(
          (id) => !removedImageIds.includes(id),
        );
        const existingOrderChanged = currentExistingOrder.some(
          (id, index) => id !== survivingInitialOrder[index],
        );
        if (existingOrderChanged) {
          await reorderImagesMutation.mutateAsync({
            id: listing.id,
            imageIds: currentExistingOrder,
          });
        }

        // Phase 3 — set cover last so neither adds nor removes can override it.
        // Map the chosen new-image (by its stable preview key) → the actual DB
        // id from the add result, in the same order they were uploaded.
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
              ? addedImages[newImages.findIndex((image) => image.preview === cover.newKey)]?.id
              : undefined;

        if (desiredCoverId) {
          await setCoverMutation.mutateAsync({
            id: listing.id,
            imageId: desiredCoverId,
          });
        }

        toast.success(t("uploadModal.toasts.listingUpdated"));
      } else {
        const coverIndex =
          cover && "newKey" in cover
            ? Math.max(0, newImages.findIndex((image) => image.preview === cover.newKey))
            : 0;

        await createMutation.mutateAsync({
          data: parsed,
          images: newFiles,
          coverIndex,
        });

        toast.success(t("uploadModal.toasts.listingCreated"));
      }

      onClose();
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.issues[0]?.message ?? t("uploadModal.errors.somethingWentWrong"));
      } else {
        toast.error(t("uploadModal.errors.somethingWentWrong"));
      }
    }
  }, (formErrors) => {
    // handleSubmit's validation runs against every field, not just the
    // current step's — so a leftover invalid field on a step the user already
    // passed (e.g. a legacy listing missing a now-required field) otherwise
    // fails silently: no network call, no toast, the Save button just does
    // nothing. Jump to the first step with an error and say so.
    const erroredFields = Object.keys(formErrors);
    const stepWithError = STEPS.findIndex((_, index) =>
      (LISTING_STEP_FIELDS[index] ?? []).some((field) => erroredFields.includes(field)),
    );
    if (stepWithError !== -1) setStep(stepWithError);
    toast.error(t("uploadModal.errors.fixHighlightedFields"));
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

  const isNewCover = (image: NewImage) =>
    cover !== null && "newKey" in cover
      ? cover.newKey === image.preview
      : cover === null && !isEdit && newImages[0] === image;

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
              {isEdit ? t("uploadModal.editTitle") : t("uploadModal.uploadTitle")}
            </h2>

            <p
              id={descriptionId}
              className="mt-0.5 text-[14px] leading-5 text-[#6a7282]"
              style={mont}
            >
              {t("uploadModal.stepOf", { step: step + 1, total: STEPS.length })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t("uploadModal.closeAria")}
            className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-[#6a7282] transition-colors hover:bg-[#f3f4f6] hover:text-[#0d2138] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e4f86]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={19} />
          </button>
        </header>

        {/* Stepper */}
        <div className="shrink-0 border-b border-[#f3f4f6] bg-white px-4 py-4 sm:px-6">
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
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
                    {t(`uploadModal.steps.${label}`)}
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
                      {t("uploadModal.fields.listingName")} <span className="text-[#e7000b]">*</span>
                    </label>

                    <input
                      id="listing-title"
                      {...register("title")}
                      placeholder={t("uploadModal.fields.listingNamePlaceholder")}
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
                        {t("uploadModal.fields.listingType")} <span className="text-[#e7000b]">*</span>
                      </label>

                      <SearchableSelect
                        id="listing-type"
                        value={type}
                        onChange={(next) =>
                          setValue("type", next as PropertyType, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        options={Object.values(PropertyType).map(
                          (value) => ({ value, label: td(`propertyType.${value}`) }),
                        )}
                        placeholder={t("uploadModal.fields.selectType")}
                        searchable={false}
                        hasError={Boolean(errors.type)}
                      />

                      <FieldError message={errors.type?.message} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-2">
                      <label
                        htmlFor="listing-status"
                        className={labelClass}
                        style={mont}
                      >
                        {t("uploadModal.fields.status")} <span className="text-[#e7000b]">*</span>
                      </label>

                      <SearchableSelect
                        id="listing-status"
                        value={status}
                        onChange={(next) =>
                          setValue("status", next as PropertyStatus, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        options={Object.values(PropertyStatus).map(
                          (value) => ({ value, label: td(`status.${value}`) }),
                        )}
                        placeholder={t("uploadModal.fields.selectStatus")}
                        searchable={false}
                        hasError={Boolean(errors.status)}
                      />

                      <FieldError message={errors.status?.message} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className={labelClass} style={mont}>
                      {t("uploadModal.fields.operationType")} <span className="text-[#e7000b]">*</span>
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
                            {t(`uploadModal.operation.${operation === "Sale" ? "sale" : "rent"}`)}
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
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor="listing-sale-price"
                            className={labelClass}
                            style={mont}
                          >
                            {t("uploadModal.fields.salePrice")} <span className="text-[#e7000b]">*</span>
                          </label>

                          <CurrencyToggle
                            value={saleCurrency}
                            onChange={(next) =>
                              setValue("saleCurrency", next, { shouldDirty: true, shouldValidate: true })
                            }
                          />
                        </div>

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
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor="listing-rent-price"
                            className={labelClass}
                            style={mont}
                          >
                            {t("uploadModal.fields.rentPrice")} <span className="text-[#e7000b]">*</span>
                          </label>

                          <CurrencyToggle
                            value={rentCurrency}
                            onChange={(next) =>
                              setValue("rentCurrency", next, { shouldDirty: true, shouldValidate: true })
                            }
                          />
                        </div>

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
                        {t("uploadModal.fields.location")} <span className="text-[#e7000b]">*</span>
                      </label>

                      <div className="flex min-w-0 items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <LocationPickerInput
                            id="listing-location"
                            value={locationId}
                            onSelect={(id, name, address) => {
                              setValue("locationId", id, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              setValue("location", name, {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              if (address) {
                                setValue("fullAddress", address, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                              }
                            }}
                            placeholder={t("uploadModal.fields.searchLocations")}
                            className={`${inputClass} ${borderClass(
                              Boolean(errors.locationId),
                            )}`}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowAddLocation(true)}
                          className="h-11 shrink-0 rounded-[10px] border border-[#1e4f86] px-3.5 text-[14px] font-medium text-[#1e4f86] transition-colors hover:bg-[#eff6ff]"
                          style={mont}
                        >
                          {t("uploadModal.fields.addLocation")}
                        </button>
                      </div>

                      <FieldError message={errors.locationId?.message} />
                    </div>

                    <div className="flex min-w-0 flex-col gap-2">
                      <label
                        htmlFor="listing-full-address"
                        className={labelClass}
                        style={mont}
                      >
                        {t("uploadModal.fields.fullAddress")} <span className="text-[#e7000b]">*</span>
                      </label>

                      <PlaceAutocompleteInput
                        id="listing-full-address"
                        value={fullAddress}
                        onChange={(value) =>
                          setValue("fullAddress", value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        onPlaceSelected={(place) => {
                          if (place.formattedAddress) {
                            setValue("fullAddress", place.formattedAddress, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }
                        }}
                        fields={["formattedAddress"]}
                        placeholder={t("uploadModal.fields.fullAddressPlaceholder")}
                        className={`${inputClass} ${borderClass(
                          Boolean(errors.fullAddress),
                        )}`}
                        style={mont}
                      />

                      <FieldError message={errors.fullAddress?.message} />
                    </div>
                  </div>

                  {canAssign && (
                    <div className="flex min-w-0 flex-col gap-2">
                      <label
                        htmlFor="listing-assigned-agent"
                        className={labelClass}
                        style={mont}
                      >
                        {t("uploadModal.fields.assignedAgent")}
                      </label>

                      <SearchableSelect
                        id="listing-assigned-agent"
                        value={assignedAgentId}
                        onChange={(next) =>
                          setValue("assignedAgentId", next, {
                            shouldDirty: true,
                          })
                        }
                        options={agents.map((agent) => ({
                          value: agent.id,
                          label: agent.name,
                        }))}
                        placeholder={t("uploadModal.fields.unassigned")}
                        searchable
                        searchPlaceholder={t("uploadModal.fields.searchAgents")}
                        emptyLabel={t("uploadModal.fields.noAgentsFound")}
                        loading={agentsLoading}
                      />
                    </div>
                  )}

                  <div className="flex min-w-0 flex-col gap-2">
                    <label
                      htmlFor="listing-owner-contact"
                      className={labelClass}
                      style={mont}
                    >
                      {t("uploadModal.fields.propertyOwner")}
                    </label>

                    <div className="flex min-w-0 items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <SearchableSelect
                          id="listing-owner-contact"
                          value={ownerContactId}
                          onChange={(next) =>
                            setValue("ownerContactId", next, {
                              shouldDirty: true,
                            })
                          }
                          options={sellerContacts.map((c) => ({
                            value: c.id,
                            label: `${c.fullName} (${c.contactId})`,
                          }))}
                          placeholder={t("uploadModal.fields.noOwnerSet")}
                          searchable
                          searchPlaceholder={t("uploadModal.fields.searchContacts")}
                          emptyLabel={t("uploadModal.fields.noContactsFound")}
                          loading={contactsLoading}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAddOwnerContact(true)}
                        className="h-11 shrink-0 rounded-[10px] border border-[#1e4f86] px-3.5 text-[14px] font-medium text-[#1e4f86] transition-colors hover:bg-[#eff6ff]"
                        style={mont}
                      >
                        {t("uploadModal.fields.addContact")}
                      </button>
                    </div>

                    <p className="text-[13px] leading-5 text-[#6a7282]" style={mont}>
                      {t("uploadModal.fields.ownerHint")}
                    </p>
                  </div>

                  {canFeature && (
                    <div className="flex min-w-0 items-start justify-between gap-4 rounded-[12px] border border-[#e5e7eb] bg-[#f8fafc] p-4 sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[14px] font-semibold leading-5 text-[#1f2937]"
                          style={mont}
                        >
                          {t("uploadModal.fields.featuredListing")}
                        </p>

                        <p
                          className="mt-1 text-[14px] leading-5 text-[#6a7282]"
                          style={mont}
                        >
                          {t("uploadModal.fields.featuredListingHint")}
                        </p>
                      </div>

                      <Toggle
                        checked={isFeatured}
                        onChange={(value) =>
                          setValue("isFeatured", value, {
                            shouldDirty: true,
                          })
                        }
                        label={t("uploadModal.fields.featuredListing")}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Step 2: Listing Details */}
              {step === 1 && (
                <>
                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
                    {(
                      [
                        ["bedrooms", "uploadModal.fields.bedrooms", "3"],
                        ["bathrooms", "uploadModal.fields.bathrooms", "2"],
                      ] as const
                    ).map(([field, labelKey, placeholder]) => (
                      <div
                        key={field}
                        className="flex min-w-0 flex-col gap-2"
                      >
                        <label
                          htmlFor={`listing-${field}`}
                          className={labelClass}
                          style={mont}
                        >
                          {t(labelKey)} <span className="text-[#e7000b]">*</span>
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

                  <div className="flex min-w-0 flex-col gap-3">
                    <span className={labelClass} style={mont}>
                      {t("uploadModal.fields.area")}
                    </span>

                    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                      {areaFields.map(({ key, labelKey, placeholder, required }) => (
                        <div key={key} className="flex min-w-0 flex-col gap-2">
                          <label
                            htmlFor={`listing-${key}`}
                            className={labelClass}
                            style={mont}
                          >
                            {t(labelKey)} {required && <span className="text-[#e7000b]">*</span>}
                          </label>

                          <input
                            id={`listing-${key}`}
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            {...register(key)}
                            placeholder={placeholder}
                            className={`${inputClass} ${borderClass(
                              Boolean(errors[key]),
                            )}`}
                            style={mont}
                          />

                          <FieldError message={errors[key]?.message} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                    <div className="flex min-w-0 flex-col gap-2">
                      <label
                        htmlFor="listing-year-built"
                        className={labelClass}
                        style={mont}
                      >
                        {t("uploadModal.fields.yearBuilt")}
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
                        {t("uploadModal.fields.toilets")} <span className="text-[#e7000b]">*</span>
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
                      {t("uploadModal.fields.description")} <span className="text-[#e7000b]">*</span>
                    </label>

                    <textarea
                      id="listing-description"
                      {...register("description")}
                      placeholder={t("uploadModal.fields.descriptionPlaceholder")}
                      rows={5}
                      className={`min-h-[130px] w-full min-w-0 resize-y rounded-[10px] border bg-[#fafbfc] px-3.5 py-3 text-[14px] leading-6 text-[#0d2138] outline-none transition-all placeholder:text-[#99a1af] focus:border-[#1e4f86] focus:ring-2 focus:ring-[#1e4f86]/10 ${borderClass(
                        Boolean(errors.description),
                      )}`}
                      style={mont}
                    />

                    <FieldError message={errors.description?.message} />
                  </div>
                </>
              )}

              {/* Step 3: Features */}
              {step === 2 && (
                <>
                  {AMENITY_GROUP_ORDER.map((group) => (
                    <div key={group} className="flex min-w-0 flex-col gap-3">
                      <span className={labelClass} style={mont}>
                        {t(AMENITY_GROUP_TITLE_KEY[group])}
                      </span>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {AMENITY_OPTIONS.filter((option) => option.group === group).map(({ key }) => {
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
                                {td(`amenities.${key}`)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Step 4: Images */}
              {step === 3 && (
                <>
                  <div className="flex min-w-0 flex-col gap-2">
                    <label
                      htmlFor="listing-video-url"
                      className={labelClass}
                      style={mont}
                    >
                      {t("uploadModal.fields.videoUrl")}
                    </label>

                    <input
                      id="listing-video-url"
                      {...register("videoUrl")}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={`${inputClass} ${borderClass(
                        Boolean(errors.videoUrl),
                      )}`}
                      style={mont}
                    />

                    <FieldError message={errors.videoUrl?.message} />

                    <p
                      className="text-[12px] leading-5 text-[#9ca3af]"
                      style={mont}
                    >
                      {t("uploadModal.fields.videoUrlHint")}
                    </p>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2">
                    <label className={labelClass} style={mont}>
                      {t("uploadModal.fields.listingImages")} <span className="text-[#e7000b]">*</span>
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
                          {t("uploadModal.fields.uploadImages")}
                        </p>

                        <p
                          className="text-[14px] leading-5 text-[#6a7282]"
                          style={mont}
                        >
                          {t("uploadModal.fields.dragDropHint")}
                        </p>
                      </div>

                      <span
                        className="inline-flex h-10 items-center justify-center rounded-[9px] bg-[#1e4f86] px-4 text-[14px] font-medium text-white"
                        style={mont}
                      >
                        {t("uploadModal.fields.chooseFiles")}
                      </span>

                      <p
                        className="text-[12px] leading-5 text-[#9ca3af]"
                        style={mont}
                      >
                        {t("uploadModal.fields.imageSizeHint", { maxMb: MAX_IMAGE_MB })}
                      </p>
                    </button>

                    <FieldError message={imagesError ?? undefined} />

                    {!imagesError &&
                      totalImages === 0 &&
                      status !== PropertyStatus.DRAFT && (
                        <p
                          className="text-[12px] leading-5 text-amber-600"
                          style={mont}
                        >
                          {t("uploadModal.fields.atLeastOneImageRequired")}
                        </p>
                      )}
                  </div>

                  {existingImages.length > 0 && (
                    <div className="flex min-w-0 flex-col gap-3">
                      <p
                        className="text-[14px] font-medium text-[#1f2937]"
                        style={mont}
                      >
                        {t("uploadModal.fields.currentImages", { count: existingImages.length })}
                      </p>

                      <div
                        ref={existingDrag.containerRef}
                        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
                      >
                        {existingImages.map((image, index) => (
                          <div
                            key={image.id}
                            {...existingDrag.getItemProps(index)}
                            className={`group relative aspect-square cursor-grab overflow-hidden rounded-[10px] border bg-[#f3f4f6] transition-transform active:cursor-grabbing ${
                              isExistingCover(image.id)
                                ? "border-[#1e4f86] ring-2 ring-[#1e4f86]/15"
                                : "border-[#e5e7eb]"
                            } ${existingDrag.dragIndex === index ? "scale-95 opacity-50" : ""} ${
                              existingDrag.isDragging &&
                              existingDrag.overIndex === index &&
                              existingDrag.dragIndex !== index
                                ? "ring-2 ring-[#1e4f86]"
                                : ""
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.url}
                              alt={image.altText ?? t("uploadModal.fields.listingImageAlt")}
                              draggable={false}
                              className="size-full object-cover"
                            />

                            <button
                              type="button"
                              title={isExistingCover(image.id) ? t("uploadModal.fields.coverImageTitle") : t("uploadModal.fields.setAsCoverTitle")}
                              aria-pressed={isExistingCover(image.id)}
                              onClick={() => setCover({ existingId: image.id })}
                              disabled={isSubmitting}
                              className={`absolute left-2 top-2 flex items-center gap-1 rounded-[6px] px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed ${
                                isExistingCover(image.id)
                                  ? "bg-[#1e4f86] text-white"
                                  : "bg-black/55 text-white opacity-100 hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                              }`}
                              style={mont}
                            >
                              <Star size={12} className={isExistingCover(image.id) ? "fill-white" : ""} />
                              {isExistingCover(image.id) ? t("uploadModal.fields.coverBadge") : t("uploadModal.fields.setCoverBadge")}
                            </button>

                            <button
                              type="button"
                              title={t("uploadModal.fields.removeImageTitle")}
                              aria-label={t("uploadModal.fields.removeImageAria")}
                              onClick={() => removeExistingImage(image.id)}
                              disabled={isSubmitting}
                              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                            >
                              <X size={15} />
                            </button>

                            {existingImages.length > 1 && (
                              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                <button
                                  type="button"
                                  title={t("uploadModal.fields.moveLeftTitle")}
                                  aria-label={t("uploadModal.fields.moveLeftAria")}
                                  onClick={() => moveExistingImage(index, -1)}
                                  disabled={isSubmitting || index === 0}
                                  className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <ChevronLeft size={14} />
                                </button>

                                <button
                                  type="button"
                                  title={t("uploadModal.fields.moveRightTitle")}
                                  aria-label={t("uploadModal.fields.moveRightAria")}
                                  onClick={() => moveExistingImage(index, 1)}
                                  disabled={isSubmitting || index === existingImages.length - 1}
                                  className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <ChevronRight size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <p
                        className="text-[12px] leading-5 text-[#9ca3af]"
                        style={mont}
                      >
                        {t("uploadModal.fields.reorderHint")}
                      </p>
                    </div>
                  )}

                  {newImages.length > 0 && (
                    <div className="flex min-w-0 flex-col gap-3">
                      <p
                        className="text-[14px] font-medium text-[#1f2937]"
                        style={mont}
                      >
                        {isEdit
                          ? t("uploadModal.fields.newImages", { count: newImages.length })
                          : t("uploadModal.fields.uploadedImages", { count: newImages.length })}
                      </p>

                      <div
                        ref={newDrag.containerRef}
                        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
                      >
                        {newImages.map((image, index) => (
                          <div
                            key={image.preview}
                            {...newDrag.getItemProps(index)}
                            className={`group relative aspect-square cursor-grab overflow-hidden rounded-[10px] border bg-[#f3f4f6] transition-transform active:cursor-grabbing ${
                              isNewCover(image)
                                ? "border-[#1e4f86] ring-2 ring-[#1e4f86]/15"
                                : "border-[#e5e7eb]"
                            } ${newDrag.dragIndex === index ? "scale-95 opacity-50" : ""} ${
                              newDrag.isDragging &&
                              newDrag.overIndex === index &&
                              newDrag.dragIndex !== index
                                ? "ring-2 ring-[#1e4f86]"
                                : ""
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.preview}
                              alt={t("uploadModal.fields.uploadImageAlt", { index: index + 1 })}
                              draggable={false}
                              className="size-full object-cover"
                            />

                            <button
                              type="button"
                              title={isNewCover(image) ? t("uploadModal.fields.coverImageTitle") : t("uploadModal.fields.setAsCoverTitle")}
                              aria-pressed={isNewCover(image)}
                              onClick={() => setCover({ newKey: image.preview })}
                              disabled={isSubmitting}
                              className={`absolute left-2 top-2 flex items-center gap-1 rounded-[6px] px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed ${
                                isNewCover(image)
                                  ? "bg-[#1e4f86] text-white"
                                  : "bg-black/55 text-white opacity-100 hover:bg-black/70 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                              }`}
                              style={mont}
                            >
                              <Star size={12} className={isNewCover(image) ? "fill-white" : ""} />
                              {isNewCover(image) ? t("uploadModal.fields.coverBadge") : t("uploadModal.fields.setCoverBadge")}
                            </button>

                            <button
                              type="button"
                              title={t("uploadModal.fields.removeImageTitle")}
                              aria-label={t("uploadModal.fields.removeUploadAria", { index: index + 1 })}
                              onClick={() => removeNewImage(index)}
                              disabled={isSubmitting}
                              className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                            >
                              <X size={15} />
                            </button>

                            {newImages.length > 1 && (
                              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                                <button
                                  type="button"
                                  title={t("uploadModal.fields.moveLeftTitle")}
                                  aria-label={t("uploadModal.fields.moveLeftAria")}
                                  onClick={() => moveNewImage(index, -1)}
                                  disabled={isSubmitting || index === 0}
                                  className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <ChevronLeft size={14} />
                                </button>

                                <button
                                  type="button"
                                  title={t("uploadModal.fields.moveRightTitle")}
                                  aria-label={t("uploadModal.fields.moveRightAria")}
                                  onClick={() => moveNewImage(index, 1)}
                                  disabled={isSubmitting || index === newImages.length - 1}
                                  className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                  <ChevronRight size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <p
                        className="text-[12px] leading-5 text-[#9ca3af]"
                        style={mont}
                      >
                        {t("uploadModal.fields.reorderHint")}
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
                {t("uploadModal.errors.fixHighlightedFields")}
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
                    {t("uploadModal.actions.previous")}
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
                  {t("uploadModal.actions.cancel")}
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
                  {t("uploadModal.actions.nextStep")}
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
                    ? t("uploadModal.actions.saving")
                    : isEdit
                      ? t("uploadModal.actions.saveChanges")
                      : t("uploadModal.actions.submit")}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>

      {showAddOwnerContact && (
        <QuickAddContactModal
          onClose={() => setShowAddOwnerContact(false)}
          onCreate={(contact: ContactDto) => {
            setSellerContacts((prev) => [
              ...prev,
              { id: contact.id, fullName: contact.fullName, contactId: contact.contactId },
            ]);
            setValue("ownerContactId", contact.id, { shouldDirty: true });
            setShowAddOwnerContact(false);
          }}
        />
      )}

      {showAddLocation && (
        <EditLocationModal
          isSubmitting={createLocationMutation.isPending}
          onClose={() => setShowAddLocation(false)}
          onSubmit={async (values) => {
            try {
              const { location } = await createLocationMutation.mutateAsync(values);
              setValue("locationId", location.id, { shouldDirty: true, shouldValidate: true });
              setValue("location", `${location.name}, ${location.region}`, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("fullAddress", location.address, { shouldDirty: true, shouldValidate: true });
              toast.success(t("uploadModal.toasts.locationAdded"));
              setShowAddLocation(false);
            } catch {
              toast.error(t("uploadModal.toasts.addLocationFailed"));
            }
          }}
        />
      )}
    </div>
  );
}