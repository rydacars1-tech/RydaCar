import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.jpeg";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { LoadingBlock, Spinner } from "./common/LoadingState.jsx";

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

function ResetPasswordPage({ token = "" }) {
  const { validateResetToken, resetPassword } = useAdminAuth();
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let active = true;

    async function runValidation() {
      if (!token) {
        setTokenValid(false);
        setError("This password reset link is missing or incomplete.");
        setValidating(false);
        return;
      }

      setValidating(true);
      setError("");

      try {
        await validateResetToken(token);
        if (active) {
          setTokenValid(true);
        }
      } catch (validationError) {
        if (active) {
          setTokenValid(false);
          setError(validationError?.message || "This password reset link is invalid or has expired.");
        }
      } finally {
        if (active) {
          setValidating(false);
        }
      }
    }

    runValidation();

    return () => {
      active = false;
    };
  }, [token, validateResetToken]);

  const isSubmitDisabled = useMemo(() => submitting || !tokenValid, [submitting, tokenValid]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitDisabled) {
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = await resetPassword(token, newPassword);
      setSuccessMessage(payload.message || "Password updated successfully.");
      window.setTimeout(() => {
        window.location.hash = "#/login?reset=success";
      }, 900);
    } catch (resetError) {
      setError(resetError?.message || "Unable to reset password right now.");
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
          <h1 className="auth-title">Reset password</h1>
          <p className="auth-copy auth-copy-muted">Create a new secure password for your admin account.</p>
        </div>

        {validating ? (
          <LoadingBlock title="Validating reset link" copy="Checking that your reset token is still active." />
        ) : !tokenValid ? (
          <div className="form auth-form">
            {error ? <div className="page-alert">{error}</div> : null}
            <button type="button" className="form-primary auth-submit" onClick={() => (window.location.hash = "#/forgot-password")}>
              Request another reset link
            </button>
          </div>
        ) : (
          <form className="form auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">New password</label>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide new password" : "Show new password"}
                >
                  <EyeIcon visible={showPassword} />
                </button>
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Confirm password</label>
              <div className="auth-password-wrap">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  <EyeIcon visible={showConfirmPassword} />
                </button>
              </div>
            </div>

            {successMessage ? <div className="auth-feedback auth-feedback-success">{successMessage}</div> : null}
            {error ? <div className="page-alert">{error}</div> : null}

            <button type="submit" className="form-primary auth-submit" disabled={isSubmitDisabled}>
              <span className="auth-submit-inner">
                {submitting ? <Spinner size="sm" tone="light" label="Resetting password" /> : null}
                <span>{submitting ? "Updating password..." : "Reset password"}</span>
              </span>
            </button>
          </form>
        )}

        <div className="auth-footer">
          <button type="button" className="auth-link-button" onClick={() => (window.location.hash = "#/login")}>
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
