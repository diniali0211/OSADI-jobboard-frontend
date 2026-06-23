import { useState } from "react";
import { AlertCircle, KeyRound } from "lucide-react";
import { RECRUITERS } from "../types";
import type { JobCandidate } from "../types";
import { jobBoardApi, ApiError } from "../services/jobBoardApi";

interface HireConfirmModalProps {
  candidate: JobCandidate;
  defaultRecruiter?: string | null;
  onClose: () => void;
  onConfirmed: () => void;
}

export default function HireConfirmModal({
  candidate,
  defaultRecruiter,
  onClose,
  onConfirmed,
}: HireConfirmModalProps) {
  const [recruiter, setRecruiter] = useState(defaultRecruiter || "");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    if (!recruiter) {
      setError("Select which recruiter made this hire.");
      return;
    }
    if (!pin.trim()) {
      setError("Enter the recruiter's PIN to confirm.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await jobBoardApi.setDecision({
        link_id: candidate.link_id,
        decision: "HIRED",
        recruiter,
        pin: pin.trim(),
      });
      onConfirmed();
    } catch (err) {
      if (err instanceof ApiError) {
        // Surface the backend's actual message — it already distinguishes
        // "no PIN set up" vs "incorrect PIN" vs "hire not credited".
        setError(err.message);
      } else {
        setError("Couldn't confirm this hire. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Confirm hire</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 0 }}>
            Marking <strong style={{ color: "var(--color-text)" }}>{candidate.name || "this candidate"}</strong>{" "}
            as hired. The recruiter's PIN confirms they're the one crediting this hire — it can't be
            undone by someone else later.
          </p>

          {error && (
            <div className="banner banner-danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="field-group">
            <label className="field-label">Recruiter</label>
            <select
              className="field-select"
              value={recruiter}
              onChange={(e) => setRecruiter(e.target.value)}
              autoFocus
            >
              <option value="">Select recruiter</option>
              {RECRUITERS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">PIN</label>
            <div style={{ position: "relative" }}>
              <KeyRound
                size={15}
                style={{
                  position: "absolute",
                  left: 12,
                  top: 11,
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                className="field-input"
                style={{ paddingLeft: 34 }}
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirm();
                }}
              />
            </div>
            <div className="field-hint">No PIN yet? Set one up under Recruiter PINs.</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-success" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? <span className="spinner" /> : "Confirm hire"}
          </button>
        </div>
      </div>
    </div>
  );
}
