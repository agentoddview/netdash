import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthGate";
import { globalStyles } from "./dashboard";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.netransit.net";

const SettingsPage: React.FC = () => {
  const { user, logout, unlinkDiscord, unlinkRoblox } = useAuth();
  const navigate = useNavigate();
  const [unlinkingDiscord, setUnlinkingDiscord] = useState(false);
  const [unlinkingRoblox, setUnlinkingRoblox] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const discordProfile = user.discord;
  const robloxLinked = !!user.robloxUserId;
  const robloxLoginUrl = `${API_BASE_URL}/auth/roblox/login`;
  const discordLoginUrl = `${API_BASE_URL}/auth/discord/login`;
  const discordDisplay =
    discordProfile?.serverDisplayName ||
    discordProfile?.globalName ||
    discordProfile?.username ||
    "Discord not linked";
  const discordHandle = discordProfile?.username ? `@${discordProfile.username}` : "Not linked";
  const discordAvatarUrl = discordProfile?.avatarUrl ?? null;
  const discordLinked = !!discordProfile?.id;

  const handleUnlinkDiscord = async () => {
    setError(null);
    setUnlinkingDiscord(true);
    try {
      await unlinkDiscord();
    } catch {
      setError("Failed to unlink Discord, please try again.");
    } finally {
      setUnlinkingDiscord(false);
    }
  };

  const handleUnlinkRoblox = async () => {
    setError(null);
    setUnlinkingRoblox(true);
    try {
      await unlinkRoblox();
    } catch {
      setError("Failed to unlink Roblox, please try again.");
    } finally {
      setUnlinkingRoblox(false);
    }
  };

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

      <section className="panel">
        <div className="panel-header">
          <h2>Account Links</h2>
          <p className="muted">Manage your Roblox and Discord connections.</p>
        </div>
        <div className="permissions-grid">
          <div className="permission-row" style={{ alignItems: "center", gap: 12 }}>
            <div className="profile-avatar" style={{ width: 70, height: 70 }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={`${user.username} avatar`} />
              ) : (
                <div className="avatar-fallback large">
                  {user.username?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 4px 0" }}>{user.username}</h3>
              <p className="muted small" style={{ margin: 0 }}>
                {user.displayName}
              </p>
              <p className="muted small" style={{ margin: "4px 0 0 0" }}>
                {robloxLinked ? "Linked" : "Not linked"}
              </p>
            </div>
            <div className="permission-status" style={{ gap: 8 }}>
              {robloxLinked ? (
                <>
                  <button className="view-map" onClick={() => (window.location.href = robloxLoginUrl)}>
                    Change
                  </button>
                  <button
                    className="view-map"
                    onClick={handleUnlinkRoblox}
                    disabled={unlinkingRoblox}
                    style={{ background: "transparent" }}
                  >
                    Unlink
                  </button>
                </>
              ) : (
                <button className="join-button" onClick={() => (window.location.href = robloxLoginUrl)}>
                  Link Roblox
                </button>
              )}
            </div>
          </div>

          <div className="permission-row" style={{ alignItems: "center", gap: 12 }}>
            <div className="profile-avatar" style={{ width: 70, height: 70 }}>
              {discordAvatarUrl ? (
                <img src={discordAvatarUrl} alt={`${discordDisplay} avatar`} />
              ) : (
                <div className="avatar-fallback large">
                  {(discordDisplay?.charAt(0) || "?").toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 4px 0" }}>{discordDisplay}</h3>
              <p className="muted small" style={{ margin: 0 }}>
                {discordHandle}
              </p>
              <p className="muted small" style={{ margin: "4px 0 0 0" }}>
                {discordLinked ? "Linked" : "Not linked"}
              </p>
            </div>
            <div className="permission-status" style={{ gap: 8, flexWrap: "wrap" }}>
              {discordLinked ? (
                <>
                  <button
                    className="view-map"
                    onClick={() => {
                      localStorage.removeItem("user");
                      window.location.href = discordLoginUrl;
                    }}
                  >
                    Change
                  </button>
                  <button
                    className="view-map"
                    onClick={handleUnlinkDiscord}
                    disabled={unlinkingDiscord}
                    style={{ background: "transparent" }}
                  >
                    Unlink
                  </button>
                </>
              ) : (
                <button
                  className="join-button"
                  onClick={() => {
                    localStorage.removeItem("user");
                    window.location.href = discordLoginUrl;
                  }}
                >
                  Link Discord
                </button>
              )}
            </div>
          </div>
        </div>
        {error && (
          <p className="mod-error" role="alert" style={{ marginTop: 12 }}>
            {error}
          </p>
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
