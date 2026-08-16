const API_BASE = import.meta.env.VITE_API_URL || "";

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      "Cannot reach the API. Check that the backend is running and VITE_API_URL is set correctly."
    );
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    const message =
      data?.error ||
      (res.status === 500
        ? "Server error. Is the Flask backend running on port 5000?"
        : `Request failed (${res.status})`);
    throw new Error(message);
  }

  return data;
}

export const api = {
  health: () => request("/api/health"),
  medications: () => request("/api/medications"),
  dosages: () => request("/api/dosages"),

  login: (email, password) =>
    request("/api/auth/login", { method: "POST", body: { email, password } }),

  adminLogin: (email, password) =>
    request("/api/auth/admin/login", {
      method: "POST",
      body: { email, password },
    }),

  portalMe: (token) => request("/api/portal/me", { token }),
  portalAppointments: (token) => request("/api/portal/appointments", { token }),
  portalPrescriptions: (token) => request("/api/portal/prescriptions", { token }),

  listPatients: (token) => request("/api/admin/patients", { token }),
  getPatient: (id, token) => request(`/api/admin/patients/${id}`, { token }),
  createPatient: (body, token) =>
    request("/api/admin/patients", { method: "POST", body, token }),
  updatePatient: (id, body, token) =>
    request(`/api/admin/patients/${id}`, { method: "PUT", body, token }),

  createAppointment: (patientId, body, token) =>
    request(`/api/admin/patients/${patientId}/appointments`, {
      method: "POST",
      body,
      token,
    }),
  updateAppointment: (id, body, token) =>
    request(`/api/admin/appointments/${id}`, { method: "PUT", body, token }),
  deleteAppointment: (id, token) =>
    request(`/api/admin/appointments/${id}`, { method: "DELETE", token }),

  createPrescription: (patientId, body, token) =>
    request(`/api/admin/patients/${patientId}/prescriptions`, {
      method: "POST",
      body,
      token,
    }),
  updatePrescription: (id, body, token) =>
    request(`/api/admin/prescriptions/${id}`, { method: "PUT", body, token }),
  deletePrescription: (id, token) =>
    request(`/api/admin/prescriptions/${id}`, { method: "DELETE", token }),
};
