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
  "Richell",
  "Low Shi Wei",
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
  created_by_recruiter: string | null;
}

export interface JobPayload {
  client: string;
  position_title: string;
  employment_type: string;
  location?: string | null;
  recruiter: string; // required — every posting must have a known creator
  openings?: number;
  remark?: string | null;
  status?: string | null;
}

export interface JobEditPayload extends JobPayload {
  pin: string; // the creator's PIN, required to prove ownership
}

export interface JobAuthPayload {
  recruiter: string;
  pin: string;
}

export interface JobCandidate {
  link_id: number; // identifies this candidate's relationship to THIS job
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
  linked?: boolean;
  already_linked_to_this_job?: boolean;
  message?: string;
  existing_candidate_id?: number;
  candidate_id?: number;
  link_id?: number;
  analysis?: Record<string, unknown>;
}

export interface DecisionPayload {
  // Identifies WHICH job-relationship this decision applies to — a
  // candidate can be linked to multiple jobs, each with its own status.
  link_id: number;
  decision: CandidateStatus;
  reason?: string | null;
  // Required for every decision — the backend verifies this matches the
  // job's owner before allowing any change.
  recruiter: string;
  pin?: string | null;
}
export interface ApiErrorBody {
  detail?: string;
}

export interface Applicant {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  score: number | null;
  role_applied: string | null;
  resume_text: string | null;
  resume_url: string | null;
  created_at: string | null;
}
