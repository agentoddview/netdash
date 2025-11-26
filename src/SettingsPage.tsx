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
  const permissionRows: Array<{
    key: string;
    label: string;
    flag: boolean;
    level: number;
  }> = [
    { key: "controlCenter", label: "Control Center", flag: permissions.hasControlCenter, level: 1 },
    { key: "donator", label: "Donator", flag: permissions.isDonator, level: 2 },
    { key: "supervisor", label: "Supervisor", flag: permissions.isSupervisor, level: 3 },
    { key: "leadSupervisor", label: "Lead Supervisor", flag: permissions.isLeadSupervisor, level: 4 },
    { key: "developer", label: "Developer", flag: permissions.isDeveloper, level: 5 },
    { key: "admin", label: "Administration", flag: permissions.isAdmin, level: 6 },
  ];
  const grantedRows = permissionRows.filter((row) => row.flag);

  const getPrimaryRoleLabel = () => {
    if (permissions.isAdmin) return "Administration";
    if (permissions.isDeveloper) return "Developer";
    if (permissions.isLeadSupervisor) return "Lead Supervisor";
    if (permissions.isSupervisor) return "Supervisor";
    if (permissions.isDonator) return "Donator";
    if (permissions.hasControlCenter) return "Control Center";
    return null;
  };

  const roleLabel = getPrimaryRoleLabel();

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
          <div className="pill">
            {roleLabel ? `(${roleLabel}) ` : ""}
            Level {permissions.level}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Permissions</h2>
          <p className="muted">Access granted to your account.</p>
        </div>
        {grantedRows.length === 0 ? (
          <p className="muted">You currently don&apos;t have any special permissions.</p>
        ) : (
          <div className="permissions-grid">
            {grantedRows.map((row) => (
              <div key={row.key} className="permission-row">
                <div>
                  <p className="muted small">{row.label}</p>
                  <div className="pill">Level {row.level}</div>
                </div>
                <div className="permission-status">
                  <span className="pill">✓ Granted</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
