import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextValue {
  isUnlocked: boolean;
  adminPassword: string | null;
  unlock: (password: string) => void;
  lock: () => void;
  currentRecruiter: string | null;
  setCurrentRecruiter: (name: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "osadi_jobboard_session";
const RECRUITER_KEY = "osadi_jobboard_recruiter";

export function AuthProvider({ children }: { children: ReactNode }) {
  // sessionStorage (not localStorage) so it survives a refresh but clears
  // when the tab closes. We only ever store a boolean "unlocked" flag here —
  // never the password itself — per the no-plaintext-credential-storage rule.
  const [isUnlocked, setIsUnlocked] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_KEY) === "true"
  );
  const [adminPassword, setAdminPassword] = useState<string | null>(null);

  // Which recruiter is "you" for this browser session — just a name, not
  // a credential, so persisting it across refreshes is fine and avoids
  // having to re-pick it constantly. This identifies who is ACTING, but
  // every action that matters (hiring, editing/deleting a job posting)
  // still independently verifies a PIN server-side — picking a name here
  // never grants access on its own.
  const [currentRecruiter, setCurrentRecruiterState] = useState<string | null>(
    () => sessionStorage.getItem(RECRUITER_KEY)
  );

  function setCurrentRecruiter(name: string | null) {
    setCurrentRecruiterState(name);
    if (name) {
      sessionStorage.setItem(RECRUITER_KEY, name);
    } else {
      sessionStorage.removeItem(RECRUITER_KEY);
    }
  }

  function unlock(password: string) {
    setIsUnlocked(true);
    setAdminPassword(password);
    sessionStorage.setItem(SESSION_KEY, "true");
  }

  function lock() {
    setIsUnlocked(false);
    setAdminPassword(null);
    setCurrentRecruiter(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  return (
    <AuthContext.Provider
      value={{ isUnlocked, adminPassword, unlock, lock, currentRecruiter, setCurrentRecruiter }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- intentional: hook lives with its provider, small app
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
