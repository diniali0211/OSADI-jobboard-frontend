import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Inbox, Users } from "lucide-react";
import type { Applicant } from "../types";
import { jobBoardApi, ApiError } from "../services/jobBoardApi";
import { useAuth } from "../context/AuthContext";
import CandidateDetailModal from "./CandidateDetailModal";
import MoveToJobModal from "./MoveToJobModal";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function Applicants() {
  const { currentRecruiter } = useAuth();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailTarget, setDetailTarget] = useState<Applicant | null>(null);
  const [moveTarget, setMoveTarget] = useState<Applicant | null>(null);
  const [resumeLoadingId, setResumeLoadingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadApplicants = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await jobBoardApi.listApplicants();
      setApplicants(data);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadApplicants();
  }, [loadApplicants]);

  async function handleViewResume(applicant: Applicant) {
    setActionError(null);
    setResumeLoadingId(applicant.id);
    try {
      const { url } = await jobBoardApi.getResumeUrl(applicant.id);
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
    <div className="main-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Applicants</h1>
          <p className="page-subtitle">
            People who applied directly through the public portal, not yet linked to a job.
          </p>
        </div>
      </div>

      {!currentRecruiter && (
        <div className="banner banner-warning" style={{ maxWidth: 600 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Pick who you are from the sidebar to move applicants into your job postings.</span>
        </div>
      )}

      {error && (
        <div className="banner banner-danger" style={{ maxWidth: 600 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{error}</span>
        </div>
      )}

      {actionError && (
        <div className="banner banner-danger" style={{ maxWidth: 600 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{actionError}</span>
        </div>
      )}

      <div className="card">
        {isLoading ? (
          <div className="empty-state">
            <span className="spinner spinner-dark" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="empty-state">
            <Inbox className="empty-state-icon" />
            <div style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
              No applicants waiting
            </div>
            <div>Submissions from the public portal will show up here.</div>
          </div>
        ) : (
          <div style={{ padding: 8 }}>
            {applicants.map((a) => (
              <div key={a.id} className="candidate-card">
                <div>
                  <button
                    className="candidate-name"
                    onClick={() => setDetailTarget(a)}
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
                    {a.name || "Unnamed applicant"}
                  </button>
                  <div className="candidate-meta">
                    {a.email && <span>{a.email}</span>}
                    {a.phone && <span>{a.phone}</span>}
                    {a.score !== null && <span>Score: {a.score}</span>}
                    <span>Applied {formatDate(a.created_at)}</span>
                  </div>
                  {a.role_applied && (
                    <div style={{ marginTop: 6 }}>
                      <span className="pill pill-open">Applied for: {a.role_applied}</span>
                    </div>
                  )}
                </div>

                <div className="candidate-actions">
                  {a.resume_url && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleViewResume(a)}
                      disabled={resumeLoadingId === a.id}
                    >
                      {resumeLoadingId === a.id ? <span className="spinner spinner-dark" /> : "View resume"}
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setMoveTarget(a)}
                    disabled={!currentRecruiter}
                    title={currentRecruiter ? undefined : "Pick who you are from the sidebar first"}
                  >
                    Move to job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {detailTarget && (
        <CandidateDetailModal candidate={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

      {moveTarget && currentRecruiter && (
        <MoveToJobModal
          applicant={moveTarget}
          recruiter={currentRecruiter}
          onClose={() => setMoveTarget(null)}
          onMoved={async () => {
            setMoveTarget(null);
            await loadApplicants();
          }}
        />
      )}

      <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
        <Users size={13} />
        Moving an applicant links them to one of your own job postings — they'll disappear from this list once moved.
      </div>
    </div>
  );
}
