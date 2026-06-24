import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { RECRUITERS } from "../types";
import type { JobPayload, JobPosting } from "../types";
import { jobBoardApi, ApiError } from "../services/jobBoardApi";
import { useAuth } from "../context/AuthContext";

interface JobFormModalProps {
  job: JobPosting | null; // null = creating new
  onClose: () => void;
  onSaved: () => void;
}

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];

export default function JobFormModal({ job, onClose, onSaved }: JobFormModalProps) {
  const { currentRecruiter } = useAuth();
  const isEditing = job !== null;

  const [form, setForm] = useState<JobPayload>({
    client: job?.client || "",
    position_title: job?.position_title || "",
    employment_type: job?.employment_type || EMPLOYMENT_TYPES[0],
    location: job?.location || "",
    recruiter: job?.created_by_recruiter || currentRecruiter || "",
    openings: job?.openings ?? 1,
    remark: job?.remark || "",
  });
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function update<K extends keyof JobPayload>(key: K, value: JobPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.client.trim() || !form.position_title.trim() || !form.employment_type.trim()) {
      setError("Client, position title, and employment type are required.");
      return;
    }
    if (!form.recruiter) {
      setError("Select which recruiter this posting belongs to.");
      return;
    }
    if (isEditing && !pin.trim()) {
      setError("Enter your PIN to confirm this change.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await jobBoardApi.updateJob(job.id, { ...form, pin: pin.trim() });
      } else {
        await jobBoardApi.createJob(form);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this posting. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? "Edit posting" : "New job posting"}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="banner banner-danger">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Client *</label>
              <input
                className="field-input"
                value={form.client}
                onChange={(e) => update("client", e.target.value)}
                placeholder="e.g. Maybank"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Position title *</label>
              <input
                className="field-input"
                value={form.position_title}
                onChange={(e) => update("position_title", e.target.value)}
                placeholder="e.g. Customer Service Executive"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Employment type *</label>
              <select
                className="field-select"
                value={form.employment_type}
                onChange={(e) => update("employment_type", e.target.value)}
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Location</label>
              <input
                className="field-input"
                value={form.location || ""}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Penang"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <label className="field-label">Recruiter (owner) *</label>
              <select
                className="field-select"
                value={form.recruiter}
                onChange={(e) => update("recruiter", e.target.value)}
                disabled={isEditing}
              >
                <option value="">Select recruiter</option>
                {RECRUITERS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {isEditing ? (
                <div className="field-hint">Ownership can't be transferred once a posting is created.</div>
              ) : (
                <div className="field-hint">You'll need this recruiter's PIN to edit or delete it later.</div>
              )}
            </div>
            <div className="field-group">
              <label className="field-label">Openings</label>
              <input
                className="field-input"
                type="number"
                min={1}
                value={form.openings}
                onChange={(e) => update("openings", Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Remark</label>
            <textarea
              className="field-textarea"
              value={form.remark || ""}
              onChange={(e) => update("remark", e.target.value)}
              placeholder="Notes about this posting..."
            />
          </div>

          {isEditing && (
            <div className="field-group">
              <label className="field-label">{form.recruiter}'s PIN *</label>
              <input
                className="field-input"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN to confirm this edit"
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? <span className="spinner" /> : isEditing ? "Save changes" : "Create posting"}
          </button>
        </div>
      </form>
    </div>
  );
}
