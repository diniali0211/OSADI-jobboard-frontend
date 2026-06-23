import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextValue {
  isUnlocked: boolean;
  adminPassword: string | null;
  unlock: (password: string) => void;
  lock: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "osadi_jobboard_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  // sessionStorage (not localStorage) so it survives a refresh but clears
  // when the tab closes. We only ever store a boolean "unlocked" flag here —
  // never the password itself — per the no-plaintext-credential-storage rule.
  const [isUnlocked, setIsUnlocked] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_KEY) === "true"
  );
  const [adminPassword, setAdminPassword] = useState<string | null>(null);

  function unlock(password: string) {
    setIsUnlocked(true);
    setAdminPassword(password);
    sessionStorage.setItem(SESSION_KEY, "true");
  }

  function lock() {
    setIsUnlocked(false);
    setAdminPassword(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  return (
    <AuthContext.Provider value={{ isUnlocked, adminPassword, unlock, lock }}>
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
