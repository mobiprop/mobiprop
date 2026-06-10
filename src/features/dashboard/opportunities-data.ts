// Shared types + mock data for the dashboard Opportunities page.

export type OppStage = "Visitation" | "Offer" | "Negotiation" | "Closing" | "Qualification";
export type OppStatus = "Open" | "Closed Won" | "Closed Lost";

export type Opportunity = {
  id: number;
  name: string;
  propertyId: string;
  commission: string;
  probability: number;
  stage: OppStage;
  expectedClose: string;
  status: OppStatus;
};

export const STATUS_BADGE: Record<OppStatus, { bg: string; text: string }> = {
  "Closed Won":  { bg: "#dcfce7", text: "#16a34a" },
  "Closed Lost": { bg: "#fee2e2", text: "#dc2626" },
  Open:          { bg: "#dbeafe", text: "#1e4f86" },
};

// Stage filter tabs shown above the table.
export const STAGE_TABS = ["All", "Visitation", "Offer", "Negotiation", "Closing"] as const;

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: 1, name: "Lakeview Estate Sale",  propertyId: "#1234", commission: "$625,000",   probability: 85, stage: "Negotiation", expectedClose: "Feb 15, 2025", status: "Closed Won"  },
  { id: 2, name: "Canyon Retreat Rental", propertyId: "#1234", commission: "$30,000",    probability: 70, stage: "Offer",       expectedClose: "Feb 28, 2025", status: "Closed Lost" },
  { id: 3, name: "Oceanfront Paradise",   propertyId: "#1234", commission: "$1,200,000", probability: 45, stage: "Visitation",  expectedClose: "Mar 15, 2025", status: "Open"        },
  { id: 4, name: "Urban Loft Deal",       propertyId: "#1234", commission: "$21,600",    probability: 90, stage: "Closing",     expectedClose: "Feb 05, 2025", status: "Closed Won"  },
  { id: 5, name: "Mountain View Villa",   propertyId: "#1234", commission: "$890,000",   probability: 25, stage: "Negotiation", expectedClose: "Apr 01, 2025", status: "Open"        },
];
