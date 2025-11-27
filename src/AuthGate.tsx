import React, { createContext, useContext, useEffect, useState } from "react";
import LoginPage from "./LoginPage";

type Permissions = {
  hasRoblox: boolean;
  hasDiscord: boolean;
  isSupervisor: boolean;
  isAdmin: boolean;
  isDonator: boolean;
  hasDashboardRole: boolean;
  canSeeDashboard: boolean;
  canModerate: boolean;
};

type DiscordProfile = {
  id: string | null;
  username: string | null;
  discriminator: string | null;
  avatar: string | null;
  roles: string[];
};

export type AuthUser = {
  robloxUserId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  discord: DiscordProfile;
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
