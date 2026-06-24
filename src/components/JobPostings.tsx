import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Briefcase, CheckCircle2, Lock, Plus, Trash2, Users } from "lucide-react";
import type { JobPosting } from "../types";
import { jobBoardApi, ApiError } from "../services/jobBoardApi";
import { useAuth } from "../context/AuthContext";
import JobFormModal from "./JobFormModal";
import JobDetailModal from "./JobDetailModal";

export default function JobPostings() {
  const { currentRecruiter } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formTarget, setFormTarget] = useState<JobPosting | "new" | null>(null);
  const [detailTarget, setDetailTarget] = useState<JobPosting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JobPosting | null>(null);
  const [deletePin, setDeletePin] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await jobBoardApi.listJobs();
      setJobs(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the job board service. Check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Standard fetch-on-mount: loadJobs sets loading/error/data state from
    // an async network call, not synchronously during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadJobs();
  }, [loadJobs]);

  const stats = useMemo(() => {
    const open = jobs.filter((j) => j.status === "OPEN").length;
    const filled = jobs.filter((j) => j.status === "FILLED").length;
    const totalOpenings = jobs.reduce((sum, j) => sum + (j.openings || 0), 0);
    const totalHired = jobs.reduce((sum, j) => sum + j.hired, 0);
    return { open, filled, totalOpenings, totalHired };
  }, [jobs]);

  async function handleDelete() {
    if (!deleteTarget) return;
    if (!currentRecruiter) {
      setDeleteError("Pick who you are from the sidebar first.");
      return;
    }
    if (!deletePin.trim()) {
      setDeleteError("Enter your PIN to confirm.");
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await jobBoardApi.deleteJob(deleteTarget.id, { recruiter: currentRecruiter, pin: deletePin.trim() });
      setDeleteTarget(null);
      setDeletePin("");
      await loadJobs();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Couldn't delete this posting.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="main-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Job Postings</h1>
          <p className="page-subtitle">Track openings, link resumes, and confirm hires.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setFormTarget("new")}
          disabled={!currentRecruiter}
          title={currentRecruiter ? undefined : "Pick who you are from the sidebar first"}
        >
          <Plus size={16} />
          New posting
        </button>
      </div>

      {!currentRecruiter && (
        <div className="banner banner-warning" style={{ maxWidth: 600 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Pick who you are from the sidebar to create postings or manage your own.</span>
        </div>
      )}

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-card-label">Open postings</div>
          <div className="stat-card-value">{stats.open}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Filled postings</div>
          <div className="stat-card-value">{stats.filled}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total openings</div>
          <div className="stat-card-value">{stats.totalOpenings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Total hired</div>
          <div className="stat-card-value">{stats.totalHired}</div>
        </div>
      </div>

      {error && (
        <div className="banner banner-danger" style={{ maxWidth: 600 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div className="empty-state">
            <span className="spinner spinner-dark" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <Briefcase className="empty-state-icon" />
            <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
              No job postings yet
            </div>
            <div>Create your first posting to start tracking candidates against it.</div>
          </div>
        ) : (
          <div className="jobs-table-wrap">
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Recruiter</th>
                  <th>Openings</th>
                  <th>Pipeline</th>
                  <th>Status</th>
                  <th>Date filled</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const pct = job.openings > 0 ? Math.min(100, (job.hired / job.openings) * 100) : 0;
                  return (
                    <tr key={job.id} className="job-row" onClick={() => setDetailTarget(job)}>
                      <td>
                        <div className="cell-position">{job.position_title}</div>
                        <div className="cell-sub">
                          {job.client}
                          {job.location ? ` · ${job.location}` : ""}
                        </div>
                      </td>
                      <td>{job.recruiter || "—"}</td>
                      <td>{job.openings}</td>
                      <td style={{ minWidth: 180 }}>
                        <div className="funnel-counts" style={{ marginBottom: 6 }}>
                          <span>
                            <b>{job.submitted}</b> submitted
                          </span>
                          <span>
                            <b>{job.hired}</b>/{job.openings} hired
                          </span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td>
                        <span
                          className={`pill ${
                            job.status === "OPEN"
                              ? "pill-open"
                              : job.status === "FILLED"
                              ? "pill-filled"
                              : "pill-closed"
                          }`}
                        >
                          {job.status === "FILLED" && <CheckCircle2 size={12} />}
                          {job.status}
                        </span>
                      </td>
                      <td>{job.date_filled ? new Date(job.date_filled).toLocaleDateString("en-MY") : "—"}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {job.created_by_recruiter && job.created_by_recruiter === currentRecruiter ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setFormTarget(job)}
                              title="Edit posting"
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => setDeleteTarget(job)}
                              title="Delete posting"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--color-text-muted)", fontSize: 12.5 }}
                            title={
                              job.created_by_recruiter
                                ? `Only ${job.created_by_recruiter} can edit this`
                                : "This posting can't be edited"
                            }
                          >
                            <Lock size={12} />
                            View only
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formTarget && (
        <JobFormModal
          job={formTarget === "new" ? null : formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={async () => {
            setFormTarget(null);
            await loadJobs();
          }}
        />
      )}

      {detailTarget && (
        <JobDetailModal
          job={detailTarget}
          onClose={() => setDetailTarget(null)}
          onChanged={loadJobs}
        />
      )}

      {deleteTarget && (
        <div
          className="modal-overlay"
          onClick={() => {
            setDeleteTarget(null);
            setDeletePin("");
            setDeleteError(null);
          }}
        >
          <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title">Delete posting?</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeletePin("");
                  setDeleteError(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, marginTop: 0 }}>
                This removes <strong>{deleteTarget.position_title}</strong> at {deleteTarget.client}.
                Linked candidates stay in the system but lose their link to this posting. This can't be
                undone.
              </p>

              {deleteError && (
                <div className="banner banner-danger">
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="field-group">
                <label className="field-label">{currentRecruiter || "Your"} PIN</label>
                <input
                  className="field-input"
                  type="password"
                  inputMode="numeric"
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  placeholder="Enter your PIN to confirm"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeletePin("");
                  setDeleteError(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <span className="spinner" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
        <Users size={13} />
        Pipeline counts update automatically as candidates move through KIV, offered, and hired.
      </div>
    </div>
  );
}
