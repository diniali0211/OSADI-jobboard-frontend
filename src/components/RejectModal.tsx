import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { REJECT_REASONS } from "../types";
import type { JobCandidate } from "../types";
import { jobBoardApi, ApiError } from "../services/jobBoardApi";

interface RejectModalProps {
  candidate: JobCandidate;
  onClose: () => void;
  onConfirmed: () => void;
}

const REASON_LABELS: Record<string, string> = {
  INCOMPLETE: "Incomplete application",
  LOW_SKILL: "Skills don't match",
  INSTRUCTIONS: "Didn't follow instructions",
  LEVEL_MISMATCH: "Level mismatch",
  CULTURE: "Culture fit",
  VETTING: "Failed vetting",
};

export default function RejectModal({ candidate, onClose, onConfirmed }: RejectModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    if (!reason) {
      setError("Select a reason for rejecting this candidate.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await jobBoardApi.setDecision({
        link_id: candidate.link_id,
        decision: "REJECTED",
        reason,
      });
      onConfirmed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reject this candidate. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Reject candidate</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 0 }}>
            Rejecting <strong style={{ color: "var(--color-text)" }}>{candidate.name || "this candidate"}</strong>.
          </p>
          {error && (
            <div className="banner banner-danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}
          <div className="field-group">
            <label className="field-label">Reason</label>
            <select className="field-select" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus>
              <option value="">Select a reason</option>
              {REJECT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {REASON_LABELS[r] || r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner" /> : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}
