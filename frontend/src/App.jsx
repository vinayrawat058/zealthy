import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import { useAdminAuth } from "./auth/AdminAuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PortalHome from "./pages/PortalHome.jsx";
import PortalAppointments from "./pages/PortalAppointments.jsx";
import PortalPrescriptions from "./pages/PortalPrescriptions.jsx";
import AdminLoginPage from "./pages/admin/AdminLoginPage.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import PatientDetail from "./pages/admin/PatientDetail.jsx";
import NewPatient from "./pages/admin/NewPatient.jsx";

function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { isAdminLoggedIn } = useAdminAuth();
  if (!isAdminLoggedIn) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/portal"
        element={
          <RequireAuth>
            <PortalHome />
          </RequireAuth>
        }
      />
      <Route
        path="/portal/appointments"
        element={
          <RequireAuth>
            <PortalAppointments />
          </RequireAuth>
        }
      />
      <Route
        path="/portal/prescriptions"
        element={
          <RequireAuth>
            <PortalPrescriptions />
          </RequireAuth>
        }
      />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/patients/new"
        element={
          <RequireAdmin>
            <NewPatient />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/patients/:id"
        element={
          <RequireAdmin>
            <PatientDetail />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
