import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthGate";
import { globalStyles } from "./dashboard";

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const { permissions, discord } = user;
  const avatarFallback = user.username?.charAt(0)?.toUpperCase() ?? "?";
  const discordTag =
    discord?.username && discord?.discriminator
      ? `${discord.username}#${discord.discriminator}`
      : discord?.username || "Not linked";

  const badgeLabel =
    (permissions.isAdmin && "Admin") ||
    (permissions.isSupervisor && "Supervisor") ||
    (permissions.hasDashboardRole && "Dashboard Access") ||
    (permissions.isDonator && "Donator") ||
    null;

  return (
    <div className="dashboard">
      <style>{globalStyles}</style>
      <header className="header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
        </div>
        <div className="header-right">
          <button className="view-map" onClick={() => navigate("/")}>
            Back to dashboard
          </button>
        </div>
      </header>

      <section className="panel profile-card">
        <div className="profile-avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={`${user.username} avatar`} />
          ) : (
            <div className="avatar-fallback large">{avatarFallback}</div>
          )}
        </div>
        <div className="profile-meta">
          <h2>{user.username}</h2>
          <p className="muted">{user.displayName}</p>
          {badgeLabel && <div className="pill">{badgeLabel}</div>}
          <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
            <p className="muted small">Discord: {discordTag}</p>
            <p className="muted small">
              Roles: {discord?.roles?.length ? discord.roles.join(", ") : "None detected"}
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Permissions</h2>
          <p className="muted">Access granted to your account.</p>
        </div>
        <div className="permissions-grid">
          <div className="permission-row">
            <div>
              <p className="muted small">Dashboard Access</p>
              <div className="pill">{permissions.canSeeDashboard ? "Granted" : "Not granted"}</div>
            </div>
            <div className="permission-status">
              <span className="pill">{permissions.hasDashboardRole ? "Discord role" : "Missing role"}</span>
            </div>
          </div>
          <div className="permission-row">
            <div>
              <p className="muted small">Moderation</p>
              <div className="pill">{permissions.canModerate ? "Granted" : "Not granted"}</div>
            </div>
            <div className="permission-status">
              <span className="pill">
                {permissions.isAdmin
                  ? "Admin"
                  : permissions.isSupervisor
                  ? "Supervisor"
                  : "No moderator role"}
              </span>
            </div>
          </div>
          <div className="permission-row">
            <div>
              <p className="muted small">Roblox Linked</p>
              <div className="pill">{permissions.hasRoblox ? "Yes" : "Not linked"}</div>
            </div>
          </div>
          <div className="permission-row">
            <div>
              <p className="muted small">Discord Linked</p>
              <div className="pill">{permissions.hasDiscord ? "Yes" : "Not linked"}</div>
            </div>
          </div>
          <div className="permission-row">
            <div>
              <p className="muted small">Donator</p>
              <div className="pill">{permissions.isDonator ? "Yes" : "No"}</div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="view-map" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
