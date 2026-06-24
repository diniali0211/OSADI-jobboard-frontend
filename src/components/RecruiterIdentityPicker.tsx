import { useState } from "react";
import { ChevronDown, UserCircle2 } from "lucide-react";
import { RECRUITERS } from "../types";
import { useAuth } from "../context/AuthContext";

export default function RecruiterIdentityPicker() {
  const { currentRecruiter, setCurrentRecruiter } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        className="sidebar-link"
        onClick={() => setIsOpen((v) => !v)}
        style={{ justifyContent: "space-between", display: "flex" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <UserCircle2 size={17} />
          {currentRecruiter || "Who are you?"}
        </span>
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-md)",
            overflow: "hidden",
            zIndex: 20,
          }}
        >
          {RECRUITERS.map((name) => (
            <button
              key={name}
              onClick={() => {
                setCurrentRecruiter(name);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                background: name === currentRecruiter ? "var(--color-bg)" : "transparent",
                border: "none",
                fontSize: 13.5,
                color: "var(--color-text)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = name === currentRecruiter ? "var(--color-bg)" : "transparent")
              }
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
