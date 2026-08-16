import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatDateTime } from "../utils/dates";

export default function PortalAppointments() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.portalAppointments(token);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/portal" className="brand">
          Zeal<span>thy</span>
        </Link>
        <Link className="btn btn-ghost btn-small" to="/portal">
          ← Back to portal
        </Link>
      </header>

      <section className="panel">
        <h1>Upcoming appointments</h1>
        <p>Schedule looking ahead up to 3 months.</p>
        {error && <div className="error">{error}</div>}
        {!data ? (
          <p className="empty">Loading…</p>
        ) : data.appointments.length === 0 ? (
          <p className="empty">No upcoming appointments.</p>
        ) : (
          <div className="table-wrap" style={{ marginTop: "1rem" }}>
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Provider</th>
                  <th>Repeat</th>
                </tr>
              </thead>
              <tbody>
                {data.appointments.map((a, i) => (
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
    </div>
  );
}
