import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthGate";
import { useTheme } from "../ThemeContext";

export type AppHeaderProps = {
  activeTab: "main" | "servers" | "players";
  showLiveDot?: boolean;
  liveLabel?: string;
  title?: string;
};

const AppHeader: React.FC<AppHeaderProps> = ({ activeTab, showLiveDot = false, liveLabel = "Live", title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const avatarSrc = user?.avatarUrl;
  const avatarFallback = user?.username?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <header className="header">
      <div>
        <p className="eyebrow">Network Dashboard</p>
        <h1>{title || "Operations Pulse"}</h1>
        <div className="top-nav">
          <button
            className={`nav-link ${activeTab === "main" ? "nav-link--active" : ""}`}
            onClick={() => navigate("/")}
          >
            Main
          </button>
          <button
            className={`nav-link ${activeTab === "servers" ? "nav-link--active" : ""}`}
            onClick={() => navigate("/servers")}
          >
            Servers
          </button>
          <button
            className={`nav-link ${activeTab === "players" ? "nav-link--active" : ""}`}
            onClick={() => navigate("/players")}
          >
            Players
          </button>
        </div>
      </div>
      <div className="header-right">
        {showLiveDot && (
          <div className="status-chip">
            <span className="dot" />
            {liveLabel}
          </div>
        )}
        <div className="account-menu">
          <button
            className="account-trigger"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={open}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt={`${user?.username} avatar`} className="account-avatar" />
            ) : (
              <div className="avatar-fallback">{avatarFallback}</div>
            )}
            <span className="account-name">{user?.username}</span>
          </button>
          {open && (
            <div className="account-dropdown">
              <button className="account-item" onClick={toggleTheme}>
                {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              </button>
              {(user?.permissions.administration ?? 0) >= 6 && (
                <button
                  className="account-item"
                  onClick={() => {
                    setOpen(false);
                    navigate("/admin/users");
                  }}
                >
                  Account Admin
                </button>
              )}
              <button
                className="account-item"
                onClick={() => {
                  setOpen(false);
                  navigate("/settings");
                }}
              >
                Settings
              </button>
              <button
                className="account-item"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
