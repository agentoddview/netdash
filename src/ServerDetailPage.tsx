import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, NavLink } from "react-router-dom";
import { MapView, globalStyles, shortenServerId, getJoinUrl } from "./dashboard";
import type { GameState, Player, Server } from "./dashboard";

const API_BASE = import.meta.env.VITE_API_URL;

export const ServerDetailPage: React.FC = () => {
  const { serverId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const [playersState, setPlayersState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarMap, setAvatarMap] = useState<Record<number, string>>({});
  const [selectedServerId, setSelectedServerId] = useState<string | null>(serverId ?? null);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<number | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/dashboard/players`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load server data");
        const data = (await res.json()) as GameState;
        setPlayersState(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load server data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const currentServer = useMemo<Server | undefined>(() => {
    if (!playersState) return undefined;
    return playersState.servers.find((s) => s.serverId === selectedServerId || s.serverId === serverId);
  }, [playersState, selectedServerId, serverId]);

  const players: Player[] = currentServer?.players || [];

  const headshotApiUrl = (uid: number) => `${API_BASE}/proxy/avatar/${uid}`;
  const profileUrl = (uid: number) => `https://www.roblox.com/users/${uid}/profile`;

  useEffect(() => {
    if (!players.length) return;
    const userIds = Array.from(
      new Set(players.map((p) => p.userId).filter(Boolean).filter((id) => avatarMap[id] === undefined))
    );
    if (userIds.length === 0) return;
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        userIds.map(async (id) => {
          try {
            const res = await fetch(headshotApiUrl(id), {
              cache: "no-store",
              credentials: "include",
              headers: { accept: "application/json" },
            });
            if (!res.ok) return [id, null] as const;
            const json = (await res.json()) as { imageUrl?: string };
            return [id, json.imageUrl || null] as const;
          } catch {
            return [id, null] as const;
          }
        })
      );
      if (cancelled) return;
      const next: Record<number, string> = {};
      entries.forEach(([id, url]) => {
        if (url) next[id] = url;
      });
      if (Object.keys(next).length) setAvatarMap((prev) => ({ ...prev, ...next }));
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [players, avatarMap]);

  const hasRoles = players.length > 0;

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
          <h1>Server {shortenServerId(currentServer.serverId)}</h1>
          <div className="top-nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>
              Main
            </NavLink>
            <NavLink to="/servers" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>
              Servers
            </NavLink>
          </div>
          <p className="muted small">
            {players.length} players • Last updated {currentServer.updatedAt}
          </p>
        </div>
        <div className="header-right">
          <button className="view-map" onClick={() => navigate("/servers")}>
            Back to Servers
          </button>
          {getJoinUrl(currentServer) && (
            <a className="join-button" href={getJoinUrl(currentServer) ?? "#"}>
              Join
            </a>
          )}
        </div>
      </header>

      <div className="content-grid" style={{ gridTemplateColumns: "minmax(300px, 0.35fr) 12px minmax(0, 0.65fr)" }}>
        <section className="panel panel-servers">
          <div className="panel-header">
            <h2>Players</h2>
            <p className="muted">Players currently on this server.</p>
          </div>
          <div className="player-list">
            {hasRoles ? (
              players.map((player) => (
                <div className="player-row" key={player.userId}>
                  <div className="player-main">
                    <img
                      src={avatarMap[player.userId] || headshotApiUrl(player.userId)}
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
              ))
            ) : (
              <p className="muted">No players in this server.</p>
            )}
          </div>
        </section>

        <div className="resize-handle" aria-hidden />

        <section className="panel map-panel">
          <div className="panel-header">
            <h2>Live Map</h2>
            <p className="muted">Player positions.</p>
          </div>
          <MapView
            servers={[currentServer]}
            selectedServerId={currentServer.serverId}
            onSelect={() => {}}
            highlightedPlayerId={highlightedPlayerId}
            onSelectPlayer={setHighlightedPlayerId}
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
