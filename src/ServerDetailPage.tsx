import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { MapView, globalStyles, shortenServerId, getJoinUrl, type GameState, type Server, type Player } from "./dashboard";
import { useAuth } from "./AuthGate";
import { useTheme } from "./ThemeContext";

const API_BASE = import.meta.env.VITE_API_URL;
const headshotApiUrl = (userId: number) => `${API_BASE}/proxy/avatar/${userId}`;

const ServerDetailPage: React.FC = () => {
  const { serverId: routeServerId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [playersState, setPlayersState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(routeServerId ?? null);
  const [split, setSplit] = useState(0.32);
  const [dragging, setDragging] = useState(false);
  const contentGridRef = useRef<HTMLDivElement | null>(null);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<number | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const selectedRowRef = useRef<HTMLDivElement | null>(null);

  const handleSelectPlayer = useCallback(
    (valueOrUpdater: number | null | ((prev: number | null) => number | null)) => {
      setHighlightedPlayerId((prev) =>
        typeof valueOrUpdater === "function"
          ? (valueOrUpdater as (p: number | null) => number | null)(prev)
          : valueOrUpdater
      );
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setError(null);
      try {
        const [summaryRes, playersRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/summary`, {
            signal: controller.signal,
            cache: "no-store",
            credentials: "include",
          }),
          fetch(`${API_BASE}/dashboard/players`, {
            signal: controller.signal,
            cache: "no-store",
            credentials: "include",
          }),
        ]);

        if (summaryRes.status === 401 || playersRes.status === 401) {
          await logout();
          return;
        }

        if (!summaryRes.ok || !playersRes.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const [, playersData] = (await Promise.all([summaryRes.json(), playersRes.json()])) as [
          GameState["lastUpdated"],
          GameState
        ];

        if (cancelled) return;
        setPlayersState(playersData);
        setSelectedServerId((prev) => prev ?? routeServerId ?? playersData?.servers?.[0]?.serverId ?? null);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      controller.abort();
    };
  }, [logout, routeServerId]);

  useEffect(() => {
    if (!highlightedPlayerId || !selectedRowRef.current) return;
    selectedRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedPlayerId]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      if (!contentGridRef.current) return;
      const rect = contentGridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const clamped = Math.min(0.55, Math.max(0.18, ratio));
      setSplit(clamped);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  const currentServer = useMemo<Server | undefined>(() => {
    if (!playersState) return undefined;
    return playersState.servers.find((s) => s.serverId === (selectedServerId ?? routeServerId));
  }, [playersState, selectedServerId, routeServerId]);

  const playersWithServer: Player[] = currentServer?.players || [];

  const avatarUrl = (userId: number) => headshotApiUrl(userId);
  const profileUrl = (userId: number) => `https://www.roblox.com/users/${userId}/profile`;

  if (loading) {
    return (
      <div className="dashboard">
        <style>{globalStyles}</style>
        <p className="muted" style={{ textAlign: "center" }}>
          Loading server...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <style>{globalStyles}</style>
        <p className="muted" style={{ textAlign: "center" }}>
          Error: {error}
        </p>
      </div>
    );
  }

  if (!currentServer) {
    return (
      <div className="dashboard">
        <style>{globalStyles}</style>
        <header className="header">
          <div>
            <p className="eyebrow">Network Dashboard</p>
            <h1>Server not found</h1>
          </div>
        </header>
        <div style={{ textAlign: "center" }}>
          <p className="muted">This server is offline or could not be found.</p>
          <button className="view-map" onClick={() => navigate("/servers")}>
            Back to Servers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <style>{globalStyles}</style>
      <header className="header">
        <div>
          <p className="eyebrow">Network Dashboard</p>
          <h1>Operations Pulse</h1>
          <div className="top-nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>
              Main
            </NavLink>
            <NavLink
              to="/servers"
              className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
            >
              Servers
            </NavLink>
          </div>
        </div>
        <div className="header-right">
          <div className="status-chip">
            <span className="dot" />
            {loading ? "Syncing" : "Live"}
          </div>
          <div className="account-menu">
            <button
              className="account-trigger"
              onClick={() => setIsAccountOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={isAccountOpen}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={`${user.username} avatar`} className="account-avatar" />
              ) : (
                <div className="avatar-fallback">{user?.username?.charAt(0)?.toUpperCase() ?? "?"}</div>
              )}
              <span className="account-name">{user?.username}</span>
            </button>
            {isAccountOpen && (
              <div className="account-dropdown">
                <button className="account-item" onClick={toggleTheme}>
                  {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                </button>
                <button
                  className="account-item"
                  onClick={() => {
                    setIsAccountOpen(false);
                    navigate("/settings");
                  }}
                >
                  Settings
                </button>
                <button
                  className="account-item"
                  onClick={() => {
                    setIsAccountOpen(false);
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

      <div
        className="content-grid"
        ref={contentGridRef}
        style={{
          gridTemplateColumns: `minmax(240px, ${split}fr) 12px minmax(0, ${(1 - split).toFixed(2)}fr)`,
        }}
      >
        <section className="panel panel-servers">
          <div className="panel-header">
            <div>
              <p className="muted small">Server</p>
              <h2>{shortenServerId(currentServer.serverId)}</h2>
              <p className="muted small">
                {playersWithServer.length} players ? Last updated {currentServer.updatedAt}
              </p>
            </div>
            <div className="server-actions">
              <button className="view-map" onClick={() => navigate("/servers")}>
                Back
              </button>
              {getJoinUrl(currentServer) ? (
                <a className="join-button" href={getJoinUrl(currentServer) ?? "#"}>
                  Join
                </a>
              ) : null}
            </div>
          </div>
          <div className="player-list">
            {playersWithServer.length > 0 ? (
              playersWithServer.map((player) => {
                const isHighlighted = highlightedPlayerId === player.userId;
                return (
                  <div
                    className={`player-row ${isHighlighted ? "player-row--selected" : ""}`}
                    key={`${currentServer.serverId}-${player.userId}`}
                    ref={isHighlighted ? selectedRowRef : undefined}
                    onClick={() =>
                      handleSelectPlayer((current) => (current === player.userId ? null : player.userId))
                    }
                  >
                    <div className="player-main">
                      <img
                        src={avatarUrl(player.userId)}
                        alt={`${player.username} avatar`}
                        className="avatar"
                      />
                      <div>
                        <a
                          href={profileUrl(player.userId)}
                          target="_blank"
                          rel="noreferrer"
                          className="username-link"
                        >
                          {player.username}
                        </a>
                        <p className="muted small">{player.displayName}</p>
                      </div>
                    </div>
                    <div className="player-tags">
                      <span className="pill">{player.role || player.team || "-"}</span>
                      <span className="pill">{player.rank ?? "-"}</span>
                      <span className="pill">Miles {player.miles ?? 0}</span>
                      <span className="pill">Cash {player.cash ?? 0}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="muted">No players in this server.</p>
            )}
          </div>
        </section>

        <div
          className={`resize-handle ${dragging ? "dragging" : ""}`}
          onMouseDown={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
        />

        <section className="panel map-panel">
          <div className="panel-header">
            <h2>Live Map</h2>
            <p className="muted">Player positions (this server).</p>
          </div>
          <MapView
            servers={[currentServer]}
            selectedServerId={currentServer.serverId}
            onSelect={() => {}}
            highlightedPlayerId={highlightedPlayerId}
            onSelectPlayer={handleSelectPlayer}
            isFullscreen={isMapFullscreen}
            onToggleFullscreen={() => setIsMapFullscreen((v) => !v)}
            onExitFullscreen={() => setIsMapFullscreen(false)}
          />
        </section>
      </div>
    </div>
  );
};

export default ServerDetailPage;
