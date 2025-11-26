import React, { createContext, useContext, useEffect, useState } from "react";
import LoginPage from "./LoginPage";

type Permissions = {
  canAccessSite: boolean;
  level: number;
  hasControlCenter: boolean;
  isDonator: boolean;
  isSupervisor: boolean;
  isLeadSupervisor: boolean;
  isDeveloper: boolean;
  isAdmin: boolean;
};

export type AuthUser = {
  robloxUserId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  permissions: Permissions;
};

type AuthContextValue = {
  user: AuthUser | null;
  authenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const API_BASE = import.meta.env.VITE_API_URL;

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include",
      });
      if (res.status === 401) {
        setAuthenticated(false);
        setUser(null);
        return;
      }
      if (!res.ok) throw new Error("Failed auth check");
      const data = (await res.json()) as AuthUser;
      setUser(data);
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    } finally {
      setAuthenticated(false);
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#fff" }}>
        Checking session...
      </div>
    );
  }

  if (!authenticated) {
    return <LoginPage apiBase={API_BASE} />;
  }

  if (!user?.permissions?.canAccessSite) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b0f1e",
          color: "#eaf0ff",
          padding: "24px",
        }}
      >
        <div
          style={{
            padding: "24px",
            borderRadius: "16px",
            border: "1px solid #1f2740",
            background: "linear-gradient(180deg, #11182d, #0c1225)",
            minWidth: "320px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            display: "grid",
            gap: "12px",
          }}
        >
          <h2 style={{ margin: 0 }}>No access</h2>
          <p style={{ margin: 0, color: "#7d8cab" }}>
            You must own the Control Center Access gamepass to access this website.
          </p>
          <a
            href="https://www.roblox.com/game-pass/1601599505"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#2ca7ff",
              color: "#0b0f1e",
              fontWeight: 700,
              textDecoration: "none",
              border: "1px solid #1f2740",
            }}
          >
            Open gamepass page
          </a>
          <button
            onClick={refresh}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#0b0f1e",
              border: "1px solid #1f2740",
              color: "#eaf0ff",
              cursor: "pointer",
            }}
          >
            Recheck access
          </button>
          <button
            onClick={logout}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              background: "transparent",
              border: "1px solid #1f2740",
              color: "#eaf0ff",
              cursor: "pointer",
            }}
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, authenticated, loading: false, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthGate");
  return ctx;
};

export default AuthGate;
