import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { useAdminAuth } from "../../auth/AdminAuthContext.jsx";

export default function AdminDashboard() {
  const { token, user, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.listPatients(token);
        if (!cancelled) setPatients(list);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          if (
            String(err.message).toLowerCase().includes("token") ||
            String(err.message).toLowerCase().includes("doctor access")
          ) {
            logout();
            navigate("/admin/login");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, logout, navigate]);

  function onLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/admin" className="brand">
          Zeal<span>thy</span>
        </Link>
        <div className="nav-links">
          <span className="muted">{user?.name}</span>
          <Link className="btn btn-ghost btn-small" to="/">
            Patient portal
          </Link>
          <Link className="btn btn-small" to="/admin/patients/new">
            New patient
          </Link>
          <button className="btn btn-ghost btn-small" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h1>Mini EMR</h1>
            <p>All patients at a glance. Click a row to manage records.</p>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        {loading ? (
          <p className="empty">Loading patients…</p>
        ) : patients.length === 0 ? (
          <p className="empty">No patients yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Appointments</th>
                  <th>Prescriptions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.email}</td>
                    <td>{p.appointment_count}</td>
                    <td>{p.prescription_count}</td>
                    <td>
                      <Link to={`/admin/patients/${p.id}`}>Open →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
