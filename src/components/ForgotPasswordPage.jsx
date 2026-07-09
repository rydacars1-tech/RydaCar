import { useMemo, useState } from "react";
import logo from "../assets/logo.jpeg";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { Spinner } from "./common/LoadingState.jsx";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function ForgotPasswordPage() {
  const { requestPasswordReset } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const isSubmitDisabled = useMemo(() => submitting || !email.trim(), [email, submitting]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitDisabled) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = await requestPasswordReset(normalizedEmail, window.location.origin);
      setSuccessMessage(payload.message || "If an account exists, a reset link will be sent.");
    } catch (requestError) {
      setError(requestError?.message || "Unable to send reset instructions right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <img src={logo} alt="Ryda" className="auth-brand-logo" />
          <div className="auth-brand-title">Ryda Car</div>
        </div>

        <div className="auth-head">
          <h1 className="auth-title">Forgot password</h1>
          <p className="auth-copy auth-copy-muted">Enter your admin email address. If it exists, we will generate a secure reset link for you.</p>
        </div>

        <form className="form auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@ryda.com"
              autoComplete="email"
            />
          </div>

          {successMessage ? <div className="auth-feedback auth-feedback-success">{successMessage}</div> : null}
          {error ? <div className="page-alert">{error}</div> : null}

          <button type="submit" className="form-primary auth-submit" disabled={isSubmitDisabled}>
            <span className="auth-submit-inner">
              {submitting ? <Spinner size="sm" tone="light" label="Sending reset instructions" /> : null}
              <span>{submitting ? "Sending reset link..." : "Send reset link"}</span>
            </span>
          </button>
        </form>

        <div className="auth-footer">
          <button type="button" className="auth-link-button" onClick={() => (window.location.hash = "#/login")}>
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
