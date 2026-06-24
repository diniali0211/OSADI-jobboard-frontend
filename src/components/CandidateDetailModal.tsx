import { Briefcase, GraduationCap, Mail, MapPin, Phone, Target } from "lucide-react";
import type { JobCandidate } from "../types";
import { parseResumeAnalysis } from "../utils/parseResumeAnalysis";

interface CandidateDetailModalProps {
  candidate: JobCandidate;
  onClose: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function CandidateDetailModal({ candidate, onClose }: CandidateDetailModalProps) {
  const analysis = parseResumeAnalysis(candidate.resume_text);

  const totalYears = analysis?.experience?.totalYears ?? null;
  const totalMonths = analysis?.experience?.totalMonths ?? null;
  const hasExperienceDuration = totalYears !== null || totalMonths !== null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{candidate.name || "Unnamed candidate"}</h2>
            <div className="cell-sub" style={{ marginTop: 4 }}>
              Added {formatDate(candidate.created_at)}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Contact + score row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {candidate.email && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--color-text-muted)" }}>
                  <Mail size={15} />
                  {candidate.email}
                </div>
              )}
              {candidate.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--color-text-muted)" }}>
                  <Phone size={15} />
                  {candidate.phone}
                </div>
              )}
              {(candidate.location || analysis?.personalInfo?.location) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--color-text-muted)" }}>
                  <MapPin size={15} />
                  {candidate.location || analysis?.personalInfo?.location}
                </div>
              )}
              {hasExperienceDuration && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--color-text-muted)" }}>
                  <Briefcase size={15} />
                  {totalYears ?? 0} yrs {totalMonths ?? 0} months experience
                </div>
              )}
            </div>

            {candidate.score !== null && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "var(--color-purple-600)",
                  color: "white",
                  borderRadius: "999px",
                  width: 64,
                  height: 64,
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700 }}>{Math.round(candidate.score)}</div>
                <div style={{ fontSize: 10, opacity: 0.85 }}>score</div>
              </div>
            )}
          </div>

          {analysis?.jobMatch && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "var(--color-info-bg)",
                borderRadius: "var(--radius-md)",
                marginBottom: 24,
              }}
            >
              <Target size={16} color="var(--color-info)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13.5 }}>
                Best match: <strong>{analysis.jobMatch.title || "—"}</strong>
                {typeof analysis.jobMatch.matchPercentage === "number" && (
                  <span style={{ color: "var(--color-text-muted)" }}> · {analysis.jobMatch.matchPercentage}% match</span>
                )}
              </div>
            </div>
          )}

          {analysis?.skills && analysis.skills.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-text-muted)", marginBottom: 10 }}>
                Skills
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {analysis.skills.map((skill, i) => (
                  <span
                    key={`${skill.name}-${i}`}
                    className="pill pill-open"
                    style={{ textTransform: "capitalize" }}
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis?.experience?.positions && analysis.experience.positions.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-text-muted)", marginBottom: 10 }}>
                Work experience
              </h3>
              {analysis.experience.positions.map((pos, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{pos.title || "—"}</div>
                  {pos.company && (
                    <div style={{ fontSize: 13.5, color: "var(--color-text-muted)", marginTop: 2 }}>{pos.company}</div>
                  )}
                  {pos.duration && (
                    <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 4 }}>{pos.duration}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {analysis?.education && analysis.education.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-text-muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <GraduationCap size={14} />
                Education
              </h3>
              {analysis.education.map((edu, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--color-bg)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    marginBottom: 8,
                  }}
                >
                  {edu.level && (
                    <span className="pill pill-filled" style={{ marginBottom: 6, display: "inline-block" }}>
                      {edu.level}
                    </span>
                  )}
                  {edu.field && <div style={{ fontWeight: 600, fontSize: 14 }}>{edu.field}</div>}
                  {edu.institution && (
                    <div style={{ fontSize: 13.5, color: "var(--color-text-muted)", marginTop: 2 }}>{edu.institution}</div>
                  )}
                  {edu.year && (
                    <div style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 4 }}>{edu.year}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!analysis && (
            <div className="empty-state" style={{ padding: "32px 16px" }}>
              Detailed analysis isn't available for this candidate — only the basic info parsed correctly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
