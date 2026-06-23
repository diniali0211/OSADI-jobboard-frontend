import { Briefcase, ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export type Page = "jobs" | "pins";

interface SidebarProps {
  page: Page;
  onNavigate: (page: Page) => void;
}

export default function Sidebar({ page, onNavigate }: SidebarProps) {
  const { lock } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark" />
        <div>
          <div className="sidebar-brand-text">OSADI Job Board</div>
          <div className="sidebar-brand-sub">Recruiter workspace</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`sidebar-link ${page === "jobs" ? "active" : ""}`}
          onClick={() => onNavigate("jobs")}
        >
          <Briefcase size={17} />
          Job Postings
        </button>
        <button
          className={`sidebar-link ${page === "pins" ? "active" : ""}`}
          onClick={() => onNavigate("pins")}
        >
          <ShieldCheck size={17} />
          Recruiter PINs
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-lock-btn" onClick={lock}>
          <LogOut size={15} />
          Lock workspace
        </button>
      </div>
    </aside>
  );
}
