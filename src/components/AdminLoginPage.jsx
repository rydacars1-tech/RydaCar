import { useState } from "react";
import logo from "../assets/logo.jpeg";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

function AdminLoginPage() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("admin@ryda.com");
  const [password, setPassword] = useState("123456");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await login(email, password);
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
            <div className="auth-brand-subtitle">Admin access</div>
          </div>
        </div>

        <div className="auth-head">
          <h1 className="auth-title">Sign in to admin panel</h1>
          <p className="auth-copy">Use your backend admin credentials to load the live dashboard, bookings, QR codes, and settings.</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
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
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </div>

          {error ? <div className="page-alert">{error}</div> : null}

          <button type="submit" className="form-primary" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLoginPage;
