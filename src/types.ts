export interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  headline: string | null;
  company: string | null;
  location: string | null;
  salesNavUrl: string | null;
  linkedinUrl: string | null;
  linkedinId: string | null;
  isOpenProfile: boolean;
  segment: string;
  stage: string;
  createdAt: string;
  fitScore: number | null;
  fitAnalysis: string | null;
}

export interface LeadsResponse {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadsStats {
  total: number;
  bySegment: { segment: string; count: number }[];
  byStage: { stage: string; count: number }[];
  openProfiles: number;
}

export type Stage = "sourced" | "screening" | "interview" | "offer" | "hired" | "rejected";

export interface Candidate {
  id: string;
  name: string;
  position: string;
  company: string;
  linkedinUrl: string;
  location: string;
  experienceYears: number;
  fitScore: number;
  dateAdded: string;
  stage: Stage;
  account: string;
  targetPosition: string;
}

export const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: "sourced", label: "Sourced", color: "#6b7280" },
  { key: "screening", label: "Screening", color: "#8b5cf6" },
  { key: "interview", label: "Interview", color: "#3b82f6" },
  { key: "offer", label: "Offer", color: "#f59e0b" },
  { key: "hired", label: "Hired", color: "#10b981" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
];

export const ACCOUNTS = ["All", "Acme Corp", "TechStart Inc", "Nexus AI", "Pinnacle Labs"];
export const POSITIONS = ["All", "GTM Engineer", "Full Stack Dev", "DevOps Engineer", "VP Sales", "Account Executive", "SDR", "Senior Designer", "UX Researcher"];
