// Shared types + mock data for the dashboard Leads page.

export type LeadStatus = "Cold" | "Won" | "In Progress" | "Lost";

export type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string;
  source: string;
  location: string;
  budget: string;
  score: number;
  status: LeadStatus;
};

export const STATUS_BADGE: Record<LeadStatus, { bg: string; text: string }> = {
  Cold:          { bg: "#e0f2fe", text: "#0284c7" },
  Won:           { bg: "#dcfce7", text: "#16a34a" },
  "In Progress": { bg: "#e0e7ff", text: "#4f46e5" },
  Lost:          { bg: "#fee2e2", text: "#dc2626" },
};

// Score bar color thresholds.
export function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export const MOCK_LEADS: Lead[] = [
  { id: 1, name: "Esther Howard", email: "esther.ul@email.com", phone: "+54 11 5555-0201", source: "Zonaprop", location: "Buenos Aires", budget: "$500k-$700k", score: 75, status: "Cold"        },
  { id: 2, name: "Jenny Wilson",  email: "esther.ul@email.com", phone: "+54 11 5555-0201", source: "Zonaprop", location: "Córdoba",      budget: "$500k-$700k", score: 15, status: "Won"         },
  { id: 3, name: "Guy Hawkins",   email: "esther.ul@email.com", phone: "+54 11 5555-0201", source: "Zonaprop", location: "Rosario",      budget: "$500k-$700k", score: 50, status: "Won"         },
  { id: 4, name: "Jacob Jones",   email: "esther.ul@email.com", phone: "+54 11 5555-0201", source: "Zonaprop", location: "Mendoza",      budget: "$500k-$700k", score: 75, status: "Cold"        },
  { id: 5, name: "Cody Fisher",   email: "esther.ul@email.com", phone: "+54 11 5555-0201", source: "Zonaprop", location: "La Plata",     budget: "$500k-$700k", score: 15, status: "In Progress" },
  { id: 6, name: "Bessie Cooper", email: "esther.ul@email.com", phone: "+54 11 5555-0201", source: "Zonaprop", location: "Mar del Plata",budget: "$500k-$700k", score: 75, status: "Cold"        },
  { id: 7, name: "Ralph Edwards", email: "esther.ul@email.com", phone: "+54 11 5555-0201", source: "Zonaprop", location: "Buenos Aires", budget: "$500k-$700k", score: 50, status: "Lost"        },
  { id: 8, name: "Floyd Miles",   email: "esther.ul@email.com", phone: "+54 11 5555-0201", source: "Zonaprop", location: "Mendoza",      budget: "$500k-$700k", score: 75, status: "Cold"        },
];
