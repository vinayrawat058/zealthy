import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext.jsx";
import { formatDate } from "../utils/dates";

export default function PortalPrescriptions() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.portalPrescriptions(token);
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
        <h1>Prescriptions</h1>
        <p>Current medications and refill dates for the next 3 months.</p>
        {error && <div className="error">{error}</div>}

        {!data ? (
          <p className="empty">Loading…</p>
        ) : (
          <>
            <h2 style={{ marginTop: "1.25rem" }}>Current prescriptions</h2>
            {data.prescriptions.length === 0 ? (
              <p className="empty">No prescriptions on file.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Medication</th>
                      <th>Dosage</th>
                      <th>Qty</th>
                      <th>Next refill</th>
                      <th>Schedule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.prescriptions.map((p) => (
                      <tr key={p.id}>
                        <td>{p.medication}</td>
                        <td>{p.dosage}</td>
                        <td>{p.quantity}</td>
                        <td>{formatDate(p.refill_on)}</td>
                        <td>
                          <span className="pill">{p.refill_schedule}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h2 style={{ marginTop: "1.5rem" }}>Refill schedule</h2>
            {data.refill_schedule.length === 0 ? (
              <p className="empty">No refills in the next 3 months.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Medication</th>
                      <th>Dosage</th>
                      <th>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.refill_schedule.map((r, i) => (
                      <tr key={`${r.id}-${r.occurrence_date}-${i}`}>
                        <td>{formatDate(r.occurrence_date)}</td>
                        <td>{r.medication}</td>
                        <td>{r.dosage}</td>
                        <td>{r.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
