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
