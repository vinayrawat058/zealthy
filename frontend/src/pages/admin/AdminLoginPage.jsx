import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAdminAuth } from "../../auth/AdminAuthContext.jsx";

export default function AdminLoginPage() {
  const { isAdminLoggedIn, login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAdminLoggedIn) return <Navigate to="/admin" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.adminLogin(email, password);
      login(data);
      navigate("/admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="panel login-card">
        <Link to="/admin/login" className="brand">
          Zeal<span>thy</span>
        </Link>
        <h1>Doctor login</h1>
        <p>Sign in with staff credentials to access the mini EMR.</p>

        <form className="form-grid" onSubmit={onSubmit} style={{ marginTop: "1.25rem" }}>
          <div className="form-row">
            <label htmlFor="admin-email">Email</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in as doctor"}
          </button>
        </form>

        <p className="hint">
          <Link to="/">Back to patient portal</Link>
        </p>
      </div>
    </div>
  );
}
