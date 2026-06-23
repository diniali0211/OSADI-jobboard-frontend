import { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import { RECRUITERS } from "../types";
import { jobBoardApi, ApiError } from "../services/jobBoardApi";
import { useAuth } from "../context/AuthContext";

interface PinState {
  recruiter: string;
  isSet: boolean | null; // null = loading
}

export default function RecruiterPins() {
  const { adminPassword } = useAuth();
  const [pinStates, setPinStates] = useState<PinState[]>(
    RECRUITERS.map((r) => ({ recruiter: r, isSet: null }))
  );
  const [activeRecruiter, setActiveRecruiter] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [adminPwInput, setAdminPwInput] = useState(adminPassword || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadStatuses() {
      const results = await Promise.all(
        RECRUITERS.map(async (r) => {
          try {
            const res = await jobBoardApi.pinStatus(r);
            return { recruiter: r, isSet: res.pin_set };
          } catch {
            return { recruiter: r, isSet: null };
          }
        })
      );
      if (!cancelled) setPinStates(results);
    }
    loadStatuses();
    return () => {
      cancelled = true;
    };
  }, []);

  function openSetup(recruiter: string) {
    setActiveRecruiter(recruiter);
    setNewPin("");
    setError(null);
    setSuccess(null);
  }

  async function handleSave() {
    if (!activeRecruiter) return;
    if (newPin.trim().length < 4) {
      setError("PIN must be at least 4 characters.");
      return;
    }
    if (!adminPwInput.trim()) {
      setError("Admin password is required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await jobBoardApi.setupRecruiterPin(activeRecruiter, newPin.trim(), adminPwInput.trim());
      setPinStates((prev) =>
        prev.map((p) => (p.recruiter === activeRecruiter ? { ...p, isSet: true } : p))
      );
      setSuccess(`PIN saved for ${activeRecruiter}.`);
      setActiveRecruiter(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Couldn't save the PIN. Try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="main-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recruiter PINs</h1>
          <p className="page-subtitle">
            Each recruiter needs a personal PIN before they can mark a candidate as hired.
            This stops anyone from crediting a hire that wasn't theirs.
          </p>
        </div>
      </div>

      {success && (
        <div className="banner banner-success" style={{ maxWidth: 480 }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{success}</span>
        </div>
      )}

      <div className="card" style={{ padding: 8 }}>
        {pinStates.map((p) => (
          <div
            key={p.recruiter}
            className="candidate-card"
            style={{ margin: 8, border: "1px solid var(--color-border)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {p.isSet === true && <ShieldCheck size={18} color="var(--color-success)" />}
              {p.isSet === false && <ShieldAlert size={18} color="var(--color-warning)" />}
              {p.isSet === null && <ShieldAlert size={18} color="var(--color-text-muted)" />}
              <div>
                <div className="candidate-name">{p.recruiter}</div>
                <div className="candidate-meta">
                  {p.isSet === true && <span style={{ color: "var(--color-success)" }}>PIN set up</span>}
                  {p.isSet === false && <span style={{ color: "var(--color-warning)" }}>No PIN yet</span>}
                  {p.isSet === null && <span>Checking...</span>}
                </div>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => openSetup(p.recruiter)}>
              {p.isSet ? "Reset PIN" : "Set up PIN"}
            </button>
          </div>
        ))}
      </div>

      {activeRecruiter && (
        <div className="modal-overlay" onClick={() => setActiveRecruiter(null)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {pinStates.find((p) => p.recruiter === activeRecruiter)?.isSet
                  ? `Reset PIN for ${activeRecruiter}`
                  : `Set up PIN for ${activeRecruiter}`}
              </h2>
              <button className="modal-close" onClick={() => setActiveRecruiter(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="banner banner-danger">
                  <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{error}</span>
                </div>
              )}
              <div className="field-group">
                <label className="field-label">New PIN (min 4 characters)</label>
                <input
                  className="field-input"
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  autoFocus
                />
              </div>
              <div className="field-group">
                <label className="field-label">Admin password</label>
                <input
                  className="field-input"
                  type="password"
                  value={adminPwInput}
                  onChange={(e) => setAdminPwInput(e.target.value)}
                  placeholder="Same password used to sign in"
                />
                <div className="field-hint">
                  Required to confirm only an admin can set or reset PINs.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setActiveRecruiter(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <span className="spinner" /> : "Save PIN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
