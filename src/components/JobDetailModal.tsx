import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Lock, Upload, UserRound } from "lucide-react";
import type { JobCandidate, JobPosting } from "../types";
import { jobBoardApi, ApiError } from "../services/jobBoardApi";
import { useAuth } from "../context/AuthContext";
import HireConfirmModal from "./HireConfirmModal";
import RejectModal from "./RejectModal";
import CandidateDetailModal from "./CandidateDetailModal";

interface JobDetailModalProps {
  job: JobPosting;
  onClose: () => void;
  onChanged: () => void; // tells parent to refresh the job list (counts changed)
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function JobDetailModal({ job, onClose, onChanged }: JobDetailModalProps) {
  const { currentRecruiter } = useAuth();
  const isOwner = job.created_by_recruiter !== null && job.created_by_recruiter === currentRecruiter;

  const [candidates, setCandidates] = useState<JobCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const [hireTarget, setHireTarget] = useState<JobCandidate | null>(null);
  const [rejectTarget, setRejectTarget] = useState<JobCandidate | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resumeLoadingId, setResumeLoadingId] = useState<number | null>(null);
  const [detailTarget, setDetailTarget] = useState<JobCandidate | null>(null);

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await jobBoardApi.getJobCandidates(job.id);
      setCandidates(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Couldn't load candidates for this job.");
    } finally {
      setIsLoading(false);
    }
  }, [job.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCandidates();
  }, [loadCandidates]);

  async function handleFile(file: File) {
    if (!isOwner || !currentRecruiter) return; // UI shouldn't allow this, but guard anyway
    setIsUploading(true);
    setUploadError(null);
    setUploadNotice(null);
    try {
      const result = await jobBoardApi.uploadResumeForJob(job.id, file, currentRecruiter);
      if (result.duplicate) {
        if (result.already_linked_to_this_job) {
          setUploadNotice(
            "This candidate is already linked to this job — nothing changed."
          );
        } else if (result.linked) {
          setUploadNotice(
            (result.message || "This candidate already exists in the system.") +
              " They've now also been linked to this job."
          );
        } else {
          setUploadNotice(
            result.message || "This resume matches a candidate already in the system."
          );
        }
      } else {
        setUploadNotice("Resume parsed and linked to this job.");
      }
      await loadCandidates();
      onChanged();
    } catch (err) {
      setUploadError(
        err instanceof ApiError
          ? err.message
          : "Couldn't analyze this resume. The main ATS service may be unavailable."
      );
    } finally {
      setIsUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function handleKiv(candidate: JobCandidate) {
    if (!currentRecruiter) return;
    setActionError(null);
    try {
      await jobBoardApi.setDecision({ link_id: candidate.link_id, decision: "KIV", recruiter: currentRecruiter });
      await loadCandidates();
      onChanged();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update this candidate.");
    }
  }

  async function handleViewResume(candidate: JobCandidate) {
    setActionError(null);
    setResumeLoadingId(candidate.id);
    try {
      const { url } = await jobBoardApi.getResumeUrl(candidate.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? `Couldn't open this resume: ${err.message}`
          : "Couldn't open this resume right now."
      );
    } finally {
      setResumeLoadingId(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{job.position_title}</h2>
            <div className="cell-sub" style={{ marginTop: 4 }}>
              {job.client} · {job.employment_type}
              {job.location ? ` · ${job.location}` : ""}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {isOwner ? (
            <div
              className={`upload-dropzone ${isDragOver ? "dragover" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById(`job-upload-${job.id}`)?.click()}
            >
              <input
                id={`job-upload-${job.id}`}
                type="file"
                accept=".pdf,.doc,.docx,image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                  e.target.value = "";
                }}
              />
              {isUploading ? (
                <span className="spinner spinner-dark" />
              ) : (
                <>
                  <Upload size={22} style={{ marginBottom: 8 }} />
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    Drop a resume here, or click to browse
                  </div>
                  <div className="field-hint">
                    Parsed by the main ATS and linked to this job automatically
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              className="banner banner-warning"
              style={{ alignItems: "center" }}
            >
              <Lock size={16} style={{ flexShrink: 0 }} />
              <span>
                {job.created_by_recruiter
                  ? `View only — only ${job.created_by_recruiter} can upload, KIV, reject, or hire on this posting.`
                  : "View only — this posting predates recruiter ownership tracking, so no one can act on it through this flow."}
              </span>
            </div>
          )}

          {uploadError && (
            <div className="banner banner-danger" style={{ marginTop: 12 }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{uploadError}</span>
            </div>
          )}
          {uploadNotice && (
            <div className="banner banner-info" style={{ marginTop: 12 }}>
              <UserRound size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{uploadNotice}</span>
            </div>
          )}

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-purple-900)", marginTop: 28 }}>
            Candidates linked to this job
          </h3>

          {actionError && (
            <div className="banner banner-danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{actionError}</span>
            </div>
          )}

          {isLoading && <div className="field-hint">Loading candidates…</div>}
          {loadError && (
            <div className="banner banner-danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{loadError}</span>
            </div>
          )}

          {!isLoading && !loadError && candidates.length === 0 && (
            <div className="empty-state" style={{ padding: "32px 16px" }}>
              No candidates linked yet. Upload a resume above to get started.
            </div>
          )}

          {candidates.map((c) => (
            <div key={c.link_id} className="candidate-card">
              <div>
                <button
                  className="candidate-name"
                  onClick={() => setDetailTarget(c)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "left",
                    textDecoration: "underline",
                    textDecorationColor: "transparent",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "currentColor")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "transparent")}
                >
                  {c.name || "Unnamed candidate"}
                </button>
                <div className="candidate-meta">
                  {c.email && <span>{c.email}</span>}
                  {c.phone && <span>{c.phone}</span>}
                  {c.score !== null && <span>Score: {c.score}</span>}
                  <span>Added {formatDate(c.created_at)}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span className={`status-badge status-${c.status}`}>{c.status}</span>
                  {c.status === "HIRED" && c.recruiter_name && (
                    <span className="field-hint" style={{ marginLeft: 8, display: "inline" }}>
                      Credited to {c.recruiter_name}
                    </span>
                  )}
                </div>
              </div>

              <div className="candidate-actions">
                {c.resume_url && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleViewResume(c)}
                    disabled={resumeLoadingId === c.id}
                  >
                    {resumeLoadingId === c.id ? <span className="spinner spinner-dark" /> : "View resume"}
                  </button>
                )}
                {isOwner && c.status !== "HIRED" && c.status !== "REJECTED" && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleKiv(c)}>
                      KIV
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setRejectTarget(c)}>
                      Reject
                    </button>
                    <button className="btn btn-success btn-sm" onClick={() => setHireTarget(c)}>
                      Mark hired
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {detailTarget && (
        <CandidateDetailModal candidate={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

      {hireTarget && job.created_by_recruiter && (
        <HireConfirmModal
          candidate={hireTarget}
          jobOwner={job.created_by_recruiter}
          onClose={() => setHireTarget(null)}
          onConfirmed={async () => {
            setHireTarget(null);
            await loadCandidates();
            onChanged();
          }}
        />
      )}

      {rejectTarget && job.created_by_recruiter && (
        <RejectModal
          candidate={rejectTarget}
          recruiter={job.created_by_recruiter}
          onClose={() => setRejectTarget(null)}
          onConfirmed={async () => {
            setRejectTarget(null);
            await loadCandidates();
            onChanged();
          }}
        />
      )}
    </div>
  );
}
