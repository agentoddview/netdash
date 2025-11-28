import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { globalStyles, shortenServerId, getJoinUrl, type GameState, type Server, type Player } from "./dashboard";
import { useAuth } from "./AuthGate";
import PlayerRow from "./PlayerRow";
import LiveMap from "./LiveMap";
import { useAvatarMap } from "./useAvatarMap";
import AppShell from "./components/AppShell";

const API_BASE = import.meta.env.VITE_API_URL;
const ServerDetailPage: React.FC = () => {
  const { serverId: routeServerId } = useParams<{ serverId: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [playersState, setPlayersState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(routeServerId ?? null);
  const [split, setSplit] = useState(0.32);
  const [dragging, setDragging] = useState(false);
  const contentGridRef = useRef<HTMLDivElement | null>(null);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<number | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
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

  const { avatarUrl } = useAvatarMap(playersWithServer);
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
      <AppShell
        headerProps={{
          activeTab: "servers",
          showLiveDot: true,
          liveLabel: loading ? "Syncing" : "Live",
          title: "Server not found",
        }}
        styles={globalStyles}
      >
        <div style={{ textAlign: "center" }}>
          <p className="muted">This server is offline or could not be found.</p>
          <button className="view-map" onClick={() => navigate("/servers")}>
            Back to Servers
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      headerProps={{
        activeTab: "servers",
        showLiveDot: true,
        liveLabel: loading ? "Syncing" : "Live",
        title: "Operations Pulse",
      }}
      styles={globalStyles}
    >

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
                {playersWithServer.length} players • Last updated {currentServer.updatedAt}
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
              playersWithServer.map((player) => (
                <PlayerRow
                  key={`${currentServer.serverId}-${player.userId}`}
                  player={player}
                  avatarUrl={avatarUrl}
                  profileUrl={profileUrl}
                  serverId={currentServer.serverId}
                  isHighlighted={highlightedPlayerId === player.userId}
                  selectedRef={highlightedPlayerId === player.userId ? selectedRowRef : null}
                  onSelect={() =>
                    handleSelectPlayer((current) => (current === player.userId ? null : player.userId))
                  }
                />
              ))
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
          <LiveMap
            servers={[currentServer]}
            selectedServerId={currentServer.serverId}
            onSelect={() => {}}
            highlightedPlayerId={highlightedPlayerId}
            onSelectPlayer={handleSelectPlayer}
            isFullscreen={isMapFullscreen}
            onToggleFullscreen={() => setIsMapFullscreen((v) => !v)}
            onExitFullscreen={() => setIsMapFullscreen(false)}
            formatServerId={shortenServerId}
          />
        </section>
      </div>
    </AppShell>
  );
};

export default ServerDetailPage;
