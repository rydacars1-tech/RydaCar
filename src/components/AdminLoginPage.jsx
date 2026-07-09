import { useState } from "react";
import logo from "../assets/logo.jpeg";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { Spinner } from "./common/LoadingState.jsx";

function EyeIcon({ visible }) {
  return visible ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6.4 0 10 7 10 7a18.78 18.78 0 0 1-3.06 4.19" />
      <path d="M6.61 6.61C4.62 8 3.28 10.06 2 12c0 0 3.6 7 10 7a10.7 10.7 0 0 0 5.39-1.39" />
    </svg>
  );
}

function AdminLoginPage({ notice = "" }) {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("admin@ryda.com");
  const [password, setPassword] = useState("123456");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const nextSession = await login(email, password);
      const role = nextSession?.user?.role || "";
      window.location.hash = role === "driver" ? "#/driver/dashboard" : "#/dashboard";
    } catch (loginError) {
      setError(loginError?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src={logo} alt="Ryda" className="auth-brand-logo" />
          <div>
            <div className="auth-brand-title">Ryda Car</div>
          </div>
        </div>

        <form className="form auth-form" onSubmit={handleSubmit}>
          {notice ? <div className="auth-feedback auth-feedback-success">{notice}</div> : null}

          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@ryda.com"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <div className="auth-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon visible={showPassword} />
              </button>
            </div>
            <div className="auth-forgot-row">
              <button type="button" className="auth-link-button" onClick={() => (window.location.hash = "#/forgot-password")}>
                Forgot Password?
              </button>
            </div>
          </div>

          {error ? <div className="page-alert">{error}</div> : null}

          <button type="submit" className="form-primary auth-submit" disabled={submitting}>
            <span className="auth-submit-inner">
              {submitting ? <Spinner size="sm" tone="light" label="Signing in" /> : null}
              <span>{submitting ? "Signing in..." : "Sign in"}</span>
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;
