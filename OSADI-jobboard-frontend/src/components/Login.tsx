import { useState, type FormEvent } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { jobBoardApi, ApiError } from "../services/jobBoardApi";

export default function Login() {
  const { unlock } = useAuth();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await jobBoardApi.verifyPassword(password);
      unlock(password);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("That password doesn't match the ATS app password.");
      } else {
        setError("Couldn't reach the job board service. Check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-mark" />
        <h1 className="login-title">OSADI Job Board</h1>
        <p className="login-subtitle">Sign in with the same password used for the ATS.</p>

        {error && (
          <div className="banner banner-danger" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="field-group">
          <label className="field-label" htmlFor="password">
            App password
          </label>
          <input
            id="password"
            className="field-input"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          disabled={isSubmitting || !password.trim()}
        >
          {isSubmitting ? <span className="spinner" /> : "Sign in"}
        </button>
      </form>
    </div>
  );
}
