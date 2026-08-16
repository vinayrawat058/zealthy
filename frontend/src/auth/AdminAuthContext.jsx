import { createContext, useContext, useMemo, useState } from "react";

const AdminAuthContext = createContext(null);
const STORAGE_KEY = "zealthy_admin_auth";

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStored);

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      token: auth?.access_token ?? null,
      isAdminLoggedIn: Boolean(
        auth?.access_token && auth?.user?.role === "admin"
      ),
      login: (payload) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setAuth(payload);
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setAuth(null);
      },
    }),
    [auth]
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
