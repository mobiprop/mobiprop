import { TourStatus, EnvelopeStatus } from "@/generated/prisma/enums";

export const TOUR_STATUS_BADGE: Record<TourStatus, { bg: string; text: string; label: string }> = {
  REQUESTED:   { bg: "#e0e7ff", text: "#4f46e5", label: "Requested"   },
  CONFIRMED:   { bg: "#d1fae5", text: "#059669", label: "Confirmed"   },
  RESCHEDULED: { bg: "#fef3c7", text: "#d97706", label: "Rescheduled" },
  COMPLETED:   { bg: "#dcfce7", text: "#16a34a", label: "Completed"   },
  CANCELLED:   { bg: "#fee2e2", text: "#dc2626", label: "Cancelled"   },
  NO_SHOW:     { bg: "#f3f4f6", text: "#6b7280", label: "No-show"     },
};

export const CONTRACT_STATUS_BADGE: Record<EnvelopeStatus, { bg: string; text: string; label: string }> = {
  SENT:      { bg: "#e0e7ff", text: "#4f46e5", label: "Awaiting signature" },
  DELIVERED: { bg: "#fef3c7", text: "#d97706", label: "Viewed"             },
  COMPLETED: { bg: "#dcfce7", text: "#16a34a", label: "Signed"             },
  DECLINED:  { bg: "#fee2e2", text: "#dc2626", label: "Declined"          },
  VOIDED:    { bg: "#f3f4f6", text: "#6b7280", label: "Voided"            },
};
