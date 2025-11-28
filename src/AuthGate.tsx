import React, { createContext, useContext, useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import { AccessDeniedPage } from "./dashboard";

type Permissions = {
  hasRoblox: boolean;
  hasDiscord: boolean;
  isSupervisor: boolean;
  isAdmin: boolean;
  isDonator: boolean;
  hasDashboardRole: boolean;
  canSeeDashboard: boolean;
  canModerate: boolean;
  administration?: number;
};

type DiscordProfile = {
  id: string | null;
  username: string | null;
  globalName: string | null;
  discriminator: string | null;
  serverDisplayName: string | null;
  avatar: string | null;
  avatarUrl: string | null;
  roles: string[];
};

export type AuthUser = {
  robloxUserId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  discord: DiscordProfile | null;
  permissions: Permissions;
};

type AuthContextValue = {
  user: AuthUser | null;
  authenticated: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  unlinkDiscord: () => Promise<void>;
  unlinkRoblox: () => Promise<void>;
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
    if (typeof window !== "undefined" && window.location.search.includes("discord_oauth_returned=1")) {
      localStorage.removeItem("user");
    }
    refresh();
  }, []);

  const postAndRefresh = async (path: string) => {
    await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
    });
    await refresh();
  };

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

  const contextValue: AuthContextValue = {
    user,
    authenticated,
    loading,
    logout,
    refresh,
    unlinkDiscord: () => postAndRefresh("/auth/unlink/discord"),
    unlinkRoblox: () => postAndRefresh("/auth/unlink/roblox"),
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#fff" }}>
        Checking session...
      </div>
    );
  }

  // If we truly have no user data, treat as logged out → login screen
  if (!user) {
    return <LoginPage apiBase={API_BASE} />;
  }

  const perms = user.permissions ?? ({} as Partial<Permissions>);
  const hasRoblox = !!perms.hasRoblox;
  const hasDiscord = !!perms.hasDiscord;
  const hasAnyAccount = hasRoblox || hasDiscord;
  const hasBothAccounts = hasRoblox && hasDiscord;
  const canSeeDashboard = !!perms.canSeeDashboard;

  // 1) No accounts at all → show the initial login screen
  if (!hasAnyAccount) {
    return <LoginPage apiBase={API_BASE} />;
  }

  // 2) Has at least one account, but either missing the other OR missing perms
  if (!hasBothAccounts || !canSeeDashboard) {
    return (
      <AuthContext.Provider value={contextValue}>
        <AccessDeniedPage
          user={user}
          onUnlinkDiscord={contextValue.unlinkDiscord}
          onUnlinkRoblox={contextValue.unlinkRoblox}
        />
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthGate");
  return ctx;
};

export default AuthGate;
