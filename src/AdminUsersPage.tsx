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

const adminStyles = `
  .admin-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .admin-row {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 16px;
  }
  .admin-identity {
    min-width: 160px;
    max-width: 240px;
  }
  .admin-identity .pill {
    display: inline-block;
  }
  .admin-muted-line {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--muted);
    font-size: 12px;
    margin-top: 6px;
  }
  .admin-account {
    flex: 1 1 220px;
    min-width: 200px;
  }
  .admin-meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 180px;
  }
  .admin-actions {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 8px;
  }
  .admin-action-btn {
    padding: 8px 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    background: rgba(255,255,255,0.05);
    color: var(--text);
    transition: background 120ms ease, border-color 120ms ease, transform 120ms ease;
  }
  .admin-action-btn:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }
  .admin-action-neutral {
    background: rgba(148,163,184,0.12);
    border-color: rgba(148,163,184,0.3);
  }
  .admin-action-neutral:hover {
    background: rgba(148,163,184,0.2);
  }
  .admin-action-warn {
    background: rgba(245,158,11,0.18);
    border-color: rgba(245,158,11,0.35);
  }
  .admin-action-warn:hover {
    background: rgba(245,158,11,0.28);
  }
  .admin-action-danger {
    background: rgba(239,68,68,0.22);
    border-color: rgba(239,68,68,0.4);
  }
  .admin-action-danger:hover {
    background: rgba(239,68,68,0.32);
  }
  @media (max-width: 720px) {
    .admin-identity {
      width: 100%;
      max-width: none;
    }
    .admin-actions {
      justify-content: flex-start;
    }
  }
`;

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
      <style>{adminStyles}</style>
      <header className="header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Account Admin</h1>
        </div>
        <div className="header-right admin-header-actions">
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
                <div key={u.id} className="permission-row admin-row">
                  <div className="admin-identity">
                    <p className="muted small" style={{ margin: 0 }}>
                      User ID
                    </p>
                    <div className="pill admin-pill">{u.id}</div>
                    <p className="admin-muted-line">
                      Last IP: {u.lastLoginIp ?? "Unknown"} · Last login:{" "}
                      {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Unknown"}
                    </p>
                  </div>

                  <div className="admin-account">
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
                      <p className="muted small" style={{ marginTop: 4 }}>
                        Not linked
                      </p>
                    )}
                  </div>

                  <div className="admin-account">
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
                      <p className="muted small" style={{ marginTop: 4 }}>
                        Not linked
                      </p>
                    )}
                  </div>

                  <div className="admin-meta">
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
                  </div>

                  <div className="admin-actions">
                    {roblox && (
                      <button
                        className="admin-action-btn admin-action-neutral"
                        onClick={() => handleUnlinkRoblox(u.id)}
                      >
                        Unlink Roblox
                      </button>
                    )}

                    {discord && (
                      <button
                        className="admin-action-btn admin-action-neutral"
                        onClick={() => handleUnlinkDiscord(u.id)}
                      >
                        Unlink Discord
                      </button>
                    )}

                    <button
                      className="admin-action-btn admin-action-neutral"
                      onClick={() => handleForceLogout(u.id)}
                    >
                      Force logout
                    </button>

                    <button className="admin-action-btn admin-action-warn" onClick={() => handleIpBan(u.id)}>
                      IP ban
                    </button>

                    <button
                      className="admin-action-btn admin-action-danger"
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
