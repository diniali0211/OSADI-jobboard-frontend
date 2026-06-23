import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Sidebar, { type Page } from "./components/Sidebar";
import JobPostings from "./components/JobPostings";
import RecruiterPins from "./components/RecruiterPins";
import "./App.css";

function AppShell() {
  const { isUnlocked } = useAuth();
  const [page, setPage] = useState<Page>("jobs");

  if (!isUnlocked) {
    return <Login />;
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} />
      {page === "jobs" ? <JobPostings /> : <RecruiterPins />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
