import { useEffect, useState } from "react";
import { AlertCircle, Briefcase } from "lucide-react";
import type { Applicant, JobPosting } from "../types";
import { jobBoardApi, ApiError } from "../services/jobBoardApi";

interface MoveToJobModalProps {
  applicant: Applicant;
  recruiter: string;
  onClose: () => void;
  onMoved: () => void;
}

export default function MoveToJobModal({ applicant, recruiter, onClose, onMoved }: MoveToJobModalProps) {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const all = await jobBoardApi.listJobs();
        if (!cancelled) {
          // Only show jobs this recruiter actually owns — moving into a
          // job they don't own would just be rejected by the backend, so
          // we filter it out here for a cleaner picker rather than
          // letting them pick something doomed to fail.
          setJobs(all.filter((j) => j.created_by_recruiter === recruiter));
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiError ? err.message : "Couldn't load your job postings.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [recruiter]);

  async function handleMove() {
    if (!selectedJobId) {
      setMoveError("Pick a job to move this applicant into.");
      return;
    }
    setIsMoving(true);
    setMoveError(null);
    try {
      await jobBoardApi.moveApplicantToJob(applicant.id, selectedJobId, recruiter);
      onMoved();
    } catch (err) {
      setMoveError(err instanceof ApiError ? err.message : "Couldn't move this applicant.");
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Move to job posting</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 0 }}>
            Moving <strong style={{ color: "var(--color-text)" }}>{applicant.name || "this applicant"}</strong>{" "}
            into one of your job postings.
          </p>

          {moveError && (
            <div className="banner banner-danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{moveError}</span>
            </div>
          )}
          {loadError && (
            <div className="banner banner-danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{loadError}</span>
            </div>
          )}

          {isLoading && <div className="field-hint">Loading your postings…</div>}

          {!isLoading && !loadError && jobs.length === 0 && (
            <div className="empty-state" style={{ padding: "24px 16px" }}>
              <Briefcase className="empty-state-icon" />
              You don't own any job postings yet — create one first.
            </div>
          )}

          {!isLoading && jobs.length > 0 && (
            <div className="field-group">
              <label className="field-label">Job posting</label>
              <select
                className="field-select"
                value={selectedJobId ?? ""}
                onChange={(e) => setSelectedJobId(Number(e.target.value))}
                autoFocus
              >
                <option value="">Select a posting</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.position_title} — {j.client}
                    {j.status !== "OPEN" ? ` (${j.status})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleMove} disabled={isMoving || jobs.length === 0}>
            {isMoving ? <span className="spinner" /> : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
}
