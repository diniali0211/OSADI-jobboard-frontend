// Mirrors the job board backend's actual response shapes (main.py / crud.py).
// Keep these in sync with the backend — do not rename fields casually.

export type JobStatus = "OPEN" | "FILLED" | "CLOSED";

export type CandidateStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "KIV"
  | "OFFERED"
  | "HIRED"
  | "RESIGNED"
  | "ABSCONDED"
  | "APPLICANT";

export const RECRUITERS = [
  "Rachel",
  "Syaf",
  "Loh Shi Wei",
  "Test Recruiter",
] as const;

export const REJECT_REASONS = [
  "INCOMPLETE",
  "LOW_SKILL",
  "INSTRUCTIONS",
  "LEVEL_MISMATCH",
  "CULTURE",
  "VETTING",
] as const;

export interface JobPosting {
  id: number;
  client: string;
  position_title: string;
  employment_type: string;
  location: string | null;
  recruiter: string | null;
  openings: number;
  date_open: string | null;
  date_filled: string | null;
  remark: string | null;
  status: JobStatus;
  submitted: number;
  shortlisted: number;
  offered: number;
  hired: number;
  remaining: number;
}

export interface JobPayload {
  client: string;
  position_title: string;
  employment_type: string;
  location?: string | null;
  recruiter?: string | null;
  openings?: number;
  remark?: string | null;
  status?: string | null;
}

export interface JobCandidate {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  score: number | null;
  status: CandidateStatus;
  resume_text: string | null;
  resume_url: string | null;
  reject_reason: string | null;
  recruiter_name: string | null;
  created_at: string | null;
  hired_date: string | null;
}

export interface AnalyzeResult {
  duplicate: boolean;
  message?: string;
  existing_candidate_id?: number;
  candidate_id?: number;
  analysis?: Record<string, unknown>;
}

export interface DecisionPayload {
  candidate_id: string;
  decision: CandidateStatus;
  reason?: string | null;
  recruiter?: string | null;
  pin?: string | null;
}

export interface ApiErrorBody {
  detail?: string;
}
