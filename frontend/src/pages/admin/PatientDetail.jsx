import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../api";
import { useAdminAuth } from "../../auth/AdminAuthContext.jsx";
import {
  formatDate,
  formatDateTime,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "../../utils/dates";

const emptyAppt = {
  provider: "",
  datetime: "",
  repeat: "weekly",
  ends_on: "",
};

const emptyRx = {
  medication: "",
  dosage: "",
  quantity: 1,
  refill_on: "",
  refill_schedule: "monthly",
};

export default function PatientDetail() {
  const { id } = useParams();
  const { token } = useAdminAuth();
  const [patient, setPatient] = useState(null);
  const [medications, setMedications] = useState([]);
  const [dosages, setDosages] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [editPatient, setEditPatient] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [apptForm, setApptForm] = useState(emptyAppt);
  const [editingApptId, setEditingApptId] = useState(null);
  const [rxForm, setRxForm] = useState(emptyRx);
  const [editingRxId, setEditingRxId] = useState(null);

  const load = useCallback(async () => {
    const [p, meds, doses] = await Promise.all([
      api.getPatient(id, token),
      api.medications(),
      api.dosages(),
    ]);
    setPatient(p);
    setMedications(meds);
    setDosages(doses);
    setEditPatient({ name: p.name, email: p.email, password: "" });
  }, [id, token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function savePatient(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const body = {
        name: editPatient.name,
        email: editPatient.email,
      };
      if (editPatient.password) body.password = editPatient.password;
      const updated = await api.updatePatient(id, body, token);
      setPatient(updated);
      setEditPatient((prev) => ({ ...prev, password: "" }));
      setMessage("Patient updated.");
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditAppt(appt) {
    setEditingApptId(appt.id);
    setApptForm({
      provider: appt.provider,
      datetime: toDatetimeLocalValue(appt.datetime),
      repeat: appt.repeat || "none",
      ends_on: appt.ends_on || "",
    });
  }

  function resetApptForm() {
    setEditingApptId(null);
    setApptForm(emptyAppt);
  }

  async function saveAppointment(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const body = {
        provider: apptForm.provider,
        datetime: fromDatetimeLocalValue(apptForm.datetime),
        repeat: apptForm.repeat,
        ends_on: apptForm.ends_on || null,
      };
      if (editingApptId) {
        await api.updateAppointment(editingApptId, body, token);
        setMessage("Appointment updated.");
      } else {
        await api.createAppointment(id, body, token);
        setMessage("Appointment created.");
      }
      resetApptForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeAppointment(apptId) {
    if (!window.confirm("Delete this appointment?")) return;
    setError("");
    try {
      await api.deleteAppointment(apptId, token);
      setMessage("Appointment deleted.");
      if (editingApptId === apptId) resetApptForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditRx(rx) {
    setEditingRxId(rx.id);
    setRxForm({
      medication: rx.medication,
      dosage: rx.dosage,
      quantity: rx.quantity,
      refill_on: rx.refill_on,
      refill_schedule: rx.refill_schedule,
    });
  }

  function resetRxForm() {
    setEditingRxId(null);
    setRxForm(emptyRx);
  }

  async function savePrescription(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const body = {
        ...rxForm,
        quantity: Number(rxForm.quantity) || 1,
      };
      if (editingRxId) {
        await api.updatePrescription(editingRxId, body, token);
        setMessage("Prescription updated.");
      } else {
        await api.createPrescription(id, body, token);
        setMessage("Prescription created.");
      }
      resetRxForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removePrescription(rxId) {
    if (!window.confirm("Delete this prescription?")) return;
    setError("");
    try {
      await api.deletePrescription(rxId, token);
      setMessage("Prescription deleted.");
      if (editingRxId === rxId) resetRxForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!patient && !error) {
    return (
      <div className="shell">
        <p className="empty">Loading patient…</p>
      </div>
    );
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

      {error && <div className="error">{error}</div>}
      {message && (
        <div className="panel" style={{ marginBottom: "1rem", borderColor: "#b7e0c8" }}>
          <p style={{ color: "var(--ok)" }}>{message}</p>
        </div>
      )}

      {patient && (
        <>
          <section className="panel">
            <h1>{patient.name}</h1>
            <p>{patient.email}</p>

            <form className="form-grid" onSubmit={savePatient} style={{ marginTop: "1rem" }}>
              <div className="grid-2">
                <div className="form-row">
                  <label>Name</label>
                  <input
                    value={editPatient.name}
                    onChange={(e) =>
                      setEditPatient((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editPatient.email}
                    onChange={(e) =>
                      setEditPatient((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <label>New password (optional)</label>
                <input
                  type="password"
                  value={editPatient.password}
                  onChange={(e) =>
                    setEditPatient((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div className="form-actions">
                <button className="btn" type="submit">
                  Save patient
                </button>
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Appointments</h2>
                <p>Create, edit, or end recurring series with an end date.</p>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Provider</th>
                    <th>Repeat</th>
                    <th>Ends</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {patient.appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty">
                        No appointments yet.
                      </td>
                    </tr>
                  ) : (
                    patient.appointments.map((a) => (
                      <tr key={a.id}>
                        <td>{formatDateTime(a.datetime)}</td>
                        <td>{a.provider}</td>
                        <td>
                          <span className="pill">{a.repeat}</span>
                        </td>
                        <td>{a.ends_on ? formatDate(a.ends_on) : "—"}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="btn btn-ghost btn-small"
                              type="button"
                              onClick={() => startEditAppt(a)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-small"
                              type="button"
                              onClick={() => removeAppointment(a.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <form className="form-grid" onSubmit={saveAppointment} style={{ marginTop: "1.25rem" }}>
              <h3>{editingApptId ? "Edit appointment" : "New appointment"}</h3>
              <div className="grid-2">
                <div className="form-row">
                  <label>Provider</label>
                  <input
                    value={apptForm.provider}
                    onChange={(e) =>
                      setApptForm((prev) => ({ ...prev, provider: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Date & time</label>
                  <input
                    type="datetime-local"
                    value={apptForm.datetime}
                    onChange={(e) =>
                      setApptForm((prev) => ({ ...prev, datetime: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Repeat</label>
                  <select
                    value={apptForm.repeat}
                    onChange={(e) =>
                      setApptForm((prev) => ({ ...prev, repeat: e.target.value }))
                    }
                  >
                    <option value="none">None</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-row">
                  <label>Ends on (optional)</label>
                  <input
                    type="date"
                    value={apptForm.ends_on}
                    onChange={(e) =>
                      setApptForm((prev) => ({ ...prev, ends_on: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn" type="submit">
                  {editingApptId ? "Update appointment" : "Add appointment"}
                </button>
                {editingApptId && (
                  <button className="btn btn-ghost" type="button" onClick={resetApptForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2>Prescriptions</h2>
                <p>Manage medications, dosages, and refill schedules.</p>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dosage</th>
                    <th>Qty</th>
                    <th>Refill on</th>
                    <th>Schedule</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {patient.prescriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty">
                        No prescriptions yet.
                      </td>
                    </tr>
                  ) : (
                    patient.prescriptions.map((rx) => (
                      <tr key={rx.id}>
                        <td>{rx.medication}</td>
                        <td>{rx.dosage}</td>
                        <td>{rx.quantity}</td>
                        <td>{formatDate(rx.refill_on)}</td>
                        <td>
                          <span className="pill">{rx.refill_schedule}</span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="btn btn-ghost btn-small"
                              type="button"
                              onClick={() => startEditRx(rx)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-small"
                              type="button"
                              onClick={() => removePrescription(rx.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <form className="form-grid" onSubmit={savePrescription} style={{ marginTop: "1.25rem" }}>
              <h3>{editingRxId ? "Edit prescription" : "New prescription"}</h3>
              <div className="grid-2">
                <div className="form-row">
                  <label>Medication</label>
                  <select
                    value={rxForm.medication}
                    onChange={(e) =>
                      setRxForm((prev) => ({ ...prev, medication: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select…</option>
                    {medications.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Dosage</label>
                  <select
                    value={rxForm.dosage}
                    onChange={(e) =>
                      setRxForm((prev) => ({ ...prev, dosage: e.target.value }))
                    }
                    required
                  >
                    <option value="">Select…</option>
                    {dosages.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={rxForm.quantity}
                    onChange={(e) =>
                      setRxForm((prev) => ({ ...prev, quantity: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Refill on</label>
                  <input
                    type="date"
                    value={rxForm.refill_on}
                    onChange={(e) =>
                      setRxForm((prev) => ({ ...prev, refill_on: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Refill schedule</label>
                  <select
                    value={rxForm.refill_schedule}
                    onChange={(e) =>
                      setRxForm((prev) => ({
                        ...prev,
                        refill_schedule: e.target.value,
                      }))
                    }
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn" type="submit">
                  {editingRxId ? "Update prescription" : "Add prescription"}
                </button>
                {editingRxId && (
                  <button className="btn btn-ghost" type="button" onClick={resetRxForm}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
