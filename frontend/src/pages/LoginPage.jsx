import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext.jsx";

export default function LoginPage() {
  const { isLoggedIn, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.notice || location.state?.email) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  if (isLoggedIn) return <Navigate to="/portal" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      login(data);
      navigate("/portal");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="panel login-card">
        <Link to="/" className="brand">
          Zeal<span>thy</span>
        </Link>
        <h1>Patient Portal</h1>
        <p>Sign in to view upcoming appointments and medication refills.</p>

        {notice && <div className="success">{notice}</div>}

        <form className="form-grid" onSubmit={onSubmit} style={{ marginTop: "1.25rem" }}>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="hint">
          Don&apos;t have an account? <Link to="/register">Register as patient</Link>
          <br />
          Staff? <Link to="/admin/login">Doctor login</Link>
        </p>
      </div>
    </div>
  );
}
