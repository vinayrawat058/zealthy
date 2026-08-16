import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const STORAGE_KEY = "zealthy_auth";

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStored);

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      token: auth?.access_token ?? null,
      isLoggedIn: Boolean(
        auth?.access_token && (auth?.user?.role ?? "patient") === "patient"
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
