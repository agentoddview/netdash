import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthGate";
import { globalStyles } from "./dashboard";
import { useAdminUsers } from "./hooks/useAdminUsers";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://api.netransit.net";

function formatDate(value?: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = (user?.permissions.administration ?? 0) >= 6;
  const { data, loading, error, refetch } = useAdminUsers();

  const handleUnlinkRoblox = async (userId: number) => {
    if (!window.confirm("Unlink this user's Roblox account?")) return;
    await fetch(`${API_BASE}/admin/users/${userId}/unlink/roblox`, {
      method: "POST",
      credentials: "include",
    });
    await refetch();
  };

  const handleUnlinkDiscord = async (userId: number) => {
    if (!window.confirm("Unlink this user's Discord account?")) return;
    await fetch(`${API_BASE}/admin/users/${userId}/unlink/discord`, {
      method: "POST",
      credentials: "include",
    });
    await refetch();
  };

  const handleForceLogout = async (userId: number) => {
    if (!window.confirm("Force logout this user from the dashboard?")) return;
    await fetch(`${API_BASE}/admin/users/${userId}/logout`, {
      method: "POST",
      credentials: "include",
    });
    await refetch();
  };

  const handleIpBan = async (userId: number) => {
    if (!window.confirm("IP-ban this user's last login IP and kick them?")) return;
    await fetch(`${API_BASE}/admin/users/${userId}/ip-ban`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Manual ban from Account Admin" }),
    });
    await refetch();
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Delete this user and all linked accounts? This cannot be undone.")) return;
    await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    });
    await refetch();
  };

  if (!user || !isAdmin) {
    return (
      <div className="dashboard">
        <style>{globalStyles}</style>
        <p className="muted" style={{ textAlign: "center", padding: "24px" }}>
          Access denied.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <style>{globalStyles}</style>
      <header className="header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Account Admin</h1>
        </div>
        <div className="header-right">
          <button className="view-map" onClick={() => navigate("/")}>
            Back to dashboard
          </button>
          <button className="view-map" onClick={refetch}>
            Refresh
          </button>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Linked Accounts</h2>
          <p className="muted">Roblox and Discord links for all users.</p>
        </div>
        {loading && <p className="muted">Loading users...</p>}
        {error && <p className="mod-error">{error}</p>}
        {!loading && !error && data && (
          <div className="permissions-grid">
            {data.map((u) => {
              const roblox = u.roblox;
              const discord = u.discord;
              const discordDisplay =
                discord?.serverDisplayName || discord?.globalName || discord?.username || "Not linked";
              const discordHandle = discord?.username ? `@${discord.username}` : "Not linked";
              return (
                <div key={u.id} className="permission-row" style={{ alignItems: "center", gap: 12 }}>
                  <div style={{ minWidth: 60 }}>
                    <p className="muted small" style={{ margin: 0 }}>
                      User ID
                    </p>
                    <div className="pill">{u.id}</div>
                    <p className="text-xs text-slate-400 mt-1">
                      Last IP: {u.lastLoginIp ?? "Unknown"} · Last login:{" "}
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Unknown"}
                    </p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="muted small" style={{ margin: 0 }}>
                      Roblox
                    </p>
                    {roblox ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        {roblox.avatarUrl ? (
                          <img
                            src={roblox.avatarUrl}
                            alt={`${roblox.username} avatar`}
                            style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #1f2740" }}
                          />
                        ) : (
                          <div className="avatar-fallback" style={{ width: 36, height: 36, borderRadius: 10 }}>
                            {roblox.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="username-link">{roblox.displayName}</div>
                          <p className="muted small" style={{ margin: 0 }}>
                            @{roblox.username} • {roblox.userId}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="muted small">Not linked</p>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="muted small" style={{ margin: 0 }}>
                      Discord
                    </p>
                    {discord ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                        {discord.avatarUrl ? (
                          <img
                            src={discord.avatarUrl}
                            alt={`${discordDisplay} avatar`}
                            style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #1f2740" }}
                          />
                        ) : (
                          <div className="avatar-fallback" style={{ width: 36, height: 36, borderRadius: "50%" }}>
                            {discordDisplay.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="username-link">{discordDisplay}</div>
                          <p className="muted small" style={{ margin: 0 }}>
                            {discordHandle} • {discord.id}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="muted small">Not linked</p>
                    )}
                  </div>
                  <div>
                    <p className="muted small" style={{ margin: 0 }}>
                      Created
                    </p>
                    <div className="pill">{formatDate(u.createdAt)}</div>
                  </div>
                  <div>
                    <p className="muted small" style={{ margin: 0 }}>
                      Updated
                    </p>
                    <div className="pill">{formatDate(u.updatedAt)}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 justify-end" style={{ flexBasis: "100%" }}>
                    {roblox && (
                      <button
                        className="px-3 py-1 rounded-md text-xs bg-slate-700 hover:bg-slate-600"
                        onClick={() => handleUnlinkRoblox(u.id)}
                      >
                        Unlink Roblox
                      </button>
                    )}

                    {discord && (
                      <button
                        className="px-3 py-1 rounded-md text-xs bg-slate-700 hover:bg-slate-600"
                        onClick={() => handleUnlinkDiscord(u.id)}
                      >
                        Unlink Discord
                      </button>
                    )}

                    <button
                      className="px-3 py-1 rounded-md text-xs bg-sky-700 hover:bg-sky-600"
                      onClick={() => handleForceLogout(u.id)}
                    >
                      Force logout
                    </button>

                    <button
                      className="px-3 py-1 rounded-md text-xs bg-amber-600 hover:bg-amber-500"
                      onClick={() => handleIpBan(u.id)}
                    >
                      IP ban
                    </button>

                    <button
                      className="px-3 py-1 rounded-md text-xs bg-red-600 hover:bg-red-500"
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete account
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminUsersPage;
