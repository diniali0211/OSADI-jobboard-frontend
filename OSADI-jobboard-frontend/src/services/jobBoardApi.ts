import type {
  AnalyzeResult,
  DecisionPayload,
  JobCandidate,
  JobPayload,
  JobPosting,
} from "../types";

const BASE_URL = import.meta.env.VITE_JOBBOARD_API_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

export const jobBoardApi = {
  async health(): Promise<{ status: string; timestamp: string }> {
    const res = await fetch(`${BASE_URL}/health`);
    return handle(res);
  },

  async verifyPassword(password: string): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return handle(res);
  },

  // ---- Jobs ----
  async listJobs(): Promise<JobPosting[]> {
    const res = await fetch(`${BASE_URL}/jobs`);
    return handle(res);
  },

  async createJob(payload: JobPayload): Promise<{ status: string; job_id: number }> {
    const res = await fetch(`${BASE_URL}/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handle(res);
  },

  async updateJob(jobId: number, payload: JobPayload): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handle(res);
  },

  async deleteJob(jobId: number): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}`, { method: "DELETE" });
    return handle(res);
  },

  // ---- Candidates on a job ----
  async getJobCandidates(jobId: number): Promise<JobCandidate[]> {
    const res = await fetch(`${BASE_URL}/jobs/${jobId}/candidates`);
    return handle(res);
  },

  async uploadResumeForJob(jobId: number, file: File): Promise<AnalyzeResult> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/jobs/${jobId}/candidates`, {
      method: "POST",
      body: form,
    });
    return handle(res);
  },

  // ---- Decisions ----
  async setDecision(payload: DecisionPayload): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handle(res);
  },

  // ---- Recruiter PINs ----
  async setupRecruiterPin(
    recruiter_name: string,
    pin: string,
    admin_password: string
  ): Promise<{ status: string; message: string }> {
    const res = await fetch(`${BASE_URL}/recruiter-pins/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recruiter_name, pin, admin_password }),
    });
    return handle(res);
  },

  async verifyRecruiterPin(
    recruiter_name: string,
    pin: string
  ): Promise<{ status: string }> {
    const res = await fetch(`${BASE_URL}/recruiter-pins/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recruiter_name, pin }),
    });
    return handle(res);
  },

  async pinStatus(recruiter_name: string): Promise<{ recruiter_name: string; pin_set: boolean }> {
    const res = await fetch(
      `${BASE_URL}/recruiter-pins/status/${encodeURIComponent(recruiter_name)}`
    );
    return handle(res);
  },
};

export { ApiError };
