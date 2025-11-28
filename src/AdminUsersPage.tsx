import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthGate";
import { globalStyles } from "./dashboard";
import { useAdminUsers } from "./hooks/useAdminUsers";

const AdminUsersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = (user?.permissions.administration ?? 0) >= 6;
  const { data, loading, error, refetch } = useAdminUsers();

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
                <div key={u.userId} className="permission-row" style={{ alignItems: "center", gap: 12 }}>
                  <div style={{ minWidth: 60 }}>
                    <p className="muted small" style={{ margin: 0 }}>
                      User ID
                    </p>
                    <div className="pill">{u.userId}</div>
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
                            @{roblox.username} • {roblox.robloxUserId}
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
                            {discordHandle} • {discord.discordUserId}
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
                    <div className="pill">{new Date(u.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <p className="muted small" style={{ margin: 0 }}>
                      Updated
                    </p>
                    <div className="pill">{new Date(u.updatedAt).toLocaleString()}</div>
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
