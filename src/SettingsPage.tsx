import React from "react";
import { useAuth } from "./AuthGate";
import { globalStyles } from "./dashboard";

type SettingsPageProps = {
  onNavigate?: (path: string) => void;
};

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const { permissions } = user;
  const rows: Array<{ label: string; granted: boolean }> = [
    { label: "Control Center", granted: permissions.hasControlCenter },
    { label: "Donator", granted: permissions.isDonator },
    { label: "Supervisor", granted: permissions.isSupervisor },
    { label: "Lead Supervisor", granted: permissions.isLeadSupervisor },
    { label: "Developer", granted: permissions.isDeveloper },
    { label: "Administration", granted: permissions.isAdmin },
  ];

  const avatarFallback = user.username?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="dashboard">
      <style>{globalStyles}</style>
      <header className="header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
        </div>
        <div className="header-right">
          <button className="view-map" onClick={() => onNavigate?.("/")}>
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
          <div className="pill">Level {permissions.level}</div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Permissions</h2>
          <p className="muted">Access granted to your account.</p>
        </div>
        <div className="permissions-grid">
          {rows.map((row) => (
            <div key={row.label} className="permission-row">
              <div>
                <p className="muted small">{row.label}</p>
                <div className="pill">Level {permissions.level}</div>
              </div>
              <div className="permission-status">
                {row.granted ? <span className="pill">✓ Granted</span> : <span className="muted">Not granted</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="logout-button" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
