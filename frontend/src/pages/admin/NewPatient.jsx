import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAdminAuth } from "../../auth/AdminAuthContext.jsx";

export default function NewPatient() {
  const { token } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const patient = await api.createPatient(form, token);
      navigate(`/admin/patients/${patient.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/admin" className="brand">
          Zeal<span>thy</span>
        </Link>
        <Link className="btn btn-ghost btn-small" to="/admin">
          ← Patients
        </Link>
      </header>

      <section className="panel" style={{ maxWidth: 520 }}>
        <h1>New patient</h1>
        <p>
          Register a patient account here. Only staff can create patients — there is no
          public signup, and doctor accounts cannot be created from this form.
        </p>

        <form className="form-grid" onSubmit={onSubmit} style={{ marginTop: "1.25rem" }}>
          <div className="form-row">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="form-actions">
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create patient"}
            </button>
            <Link className="btn btn-ghost" to="/admin">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
