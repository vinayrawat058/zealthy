import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatDate, formatDateTime } from "../utils/dates";

export default function PortalHome() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.portalMe(token);
        if (!cancelled) setData(me);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          if (String(err.message).toLowerCase().includes("token")) {
            logout();
            navigate("/");
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, logout, navigate]);

  function onLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/portal" className="brand">
          Zeal<span>thy</span>
        </Link>
        <div className="nav-links">
          <span className="muted">{user?.name}</span>
          <button className="btn btn-ghost btn-small" type="button" onClick={onLogout}>
            Log out
          </button>
        </div>
      </header>

      <section className="panel">
        <h1>Welcome back{data?.patient?.name ? `, ${data.patient.name}` : ""}</h1>
        <p>Here’s what matters in the next 7 days.</p>
        {data && (
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            {data.patient.email}
          </p>
        )}
      </section>

      {error && <div className="error">{error}</div>}

      <div className="grid-2" style={{ marginTop: "1rem" }}>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Appointments</h2>
              <p>Next 7 days</p>
            </div>
            <Link to="/portal/appointments">Full schedule →</Link>
          </div>
          {!data ? (
            <p className="empty">Loading…</p>
          ) : data.appointments_next_7_days.length === 0 ? (
            <p className="empty">No appointments in the next week.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Provider</th>
                    <th>Repeat</th>
                  </tr>
                </thead>
                <tbody>
                  {data.appointments_next_7_days.map((a, i) => (
                    <tr key={`${a.id}-${a.occurrence_datetime}-${i}`}>
                      <td>{formatDateTime(a.occurrence_datetime || a.datetime)}</td>
                      <td>{a.provider}</td>
                      <td>
                        <span className="pill">{a.repeat}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Medication refills</h2>
              <p>Next 7 days</p>
            </div>
            <Link to="/portal/prescriptions">All prescriptions →</Link>
          </div>
          {!data ? (
            <p className="empty">Loading…</p>
          ) : data.refills_next_7_days.length === 0 ? (
            <p className="empty">No refills due this week.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Medication</th>
                    <th>Dosage</th>
                  </tr>
                </thead>
                <tbody>
                  {data.refills_next_7_days.map((r, i) => (
                    <tr key={`${r.id}-${r.occurrence_date}-${i}`}>
                      <td>{formatDate(r.occurrence_date || r.refill_on)}</td>
                      <td>{r.medication}</td>
                      <td>
                        {r.dosage} · qty {r.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
