import React, { useEffect, useState, useCallback, useRef } from "react";
import netMap from "./assets/net-map.png";
import { useAuth } from "./AuthGate";

type Summary = {
  onlineTotal: number;
  onlineByRole?: Record<string, number>;
  serversOnline: number;
  lastUpdated: string | null;
};

type PlayerPosition = {
  worldX: number | null;
  worldZ: number | null;
  mapX: number | null;
  mapY: number | null;
};

type Player = {
  userId: number;
  username: string;
  displayName: string;
  role: string;
  team: string;
  teamColor: string | null;
  rank: string | null;
  miles: number | null;
  cash: number | null;
  status: string;
  joinedAt: string;
  position?: PlayerPosition | null;
};

type Server = {
  serverId: string;
  placeId: number | null;
  jobId: string | null;
  updatedAt: string;
  players: Player[];
};

type GameState = {
  servers: Server[];
  lastUpdated: string | null;
};

type SummaryResponse = Summary;
type PlayersResponse = GameState;
export type PlayerRow = Player & { serverId: string };

type ThumbnailItem = {
  targetId: number;
  state: string;
  imageUrl: string;
  version: string;
};

export type ThumbnailResponse = {
  data: ThumbnailItem[];
};

type AvatarProxyResponse = {
  imageUrl: string;
};

const API_BASE = import.meta.env.VITE_API_URL;
const headshotApiUrl = (userId: number) => `${API_BASE}/proxy/avatar/${userId}`;

const shortenServerId = (id: string) => {
  if (!id) return "-";
  const [, jobId] = id.split(":");
  const value = jobId || id;
  return value.length > 8 ? `${value.slice(0, 8)}...` : value;
};

type DashboardPageProps = {
  onNavigate?: (path: string) => void;
};

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [playersState, setPlayersState] = useState<PlayersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarMap, setAvatarMap] = useState<Record<number, string>>({});
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [split, setSplit] = useState(0.32); // fraction of width for player list
  const [dragging, setDragging] = useState(false);
  const contentGridRef = useRef<HTMLDivElement | null>(null);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<number | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const { user, logout } = useAuth();
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
  const selectedRowRef = useRef<HTMLDivElement | null>(null);

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

        const [summaryData, playersData] = (await Promise.all([
          summaryRes.json(),
          playersRes.json(),
        ])) as [SummaryResponse, PlayersResponse];

        if (cancelled) return;
        setSummary(summaryData);
        setPlayersState(playersData);
        setSelectedServerId((prev) => prev ?? playersData?.servers?.[0]?.serverId ?? null);
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
  }, []);

  // Utility to fetch a single headshot URL using backend proxy
  const fetchHeadshotUrl = async (userId: number): Promise<string | null> => {
    try {
      const url = headshotApiUrl(userId);
      const res = await fetch(url, {
        cache: "no-store",
        headers: { accept: "application/json" },
        credentials: "include",
      });
      if (res.status === 401) {
        await logout();
        return null;
      }
      if (!res.ok) return null;
      const json: AvatarProxyResponse = await res.json();
      return json.imageUrl || null;
    } catch (e) {
      return null;
    }
  };

  // Fetch avatar URLs for unique userIds using the utility above
  useEffect(() => {
    if (!playersState?.servers?.length) return;
    const userIds = Array.from(
      new Set(
        playersState.servers.flatMap((s) =>
          (s.players || []).map((p) => p.userId).filter(Boolean)
        )
      )
    ).filter((id) => avatarMap[id] === undefined);
    if (userIds.length === 0) return;

    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        userIds.map(async (id) => {
          const url = await fetchHeadshotUrl(id);
          return [id, url] as const;
        })
      );
      if (cancelled) return;
      const next: Record<number, string> = {};
      entries.forEach(([id, url]) => {
        if (url) next[id] = url;
      });
      if (Object.keys(next).length) {
        setAvatarMap((prev) => ({ ...prev, ...next }));
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [playersState, avatarMap]);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  };

  const getJoinUrl = (server: Server) => {
    const [placePart, jobPart] = (server.serverId || "").split(":");
    const parsedPlace = placePart?.startsWith("place-")
      ? Number(placePart.replace("place-", ""))
      : Number(placePart);
    const placeId = server.placeId ?? (Number.isFinite(parsedPlace) ? parsedPlace : null);
    const jobId = server.jobId ?? jobPart;
    if (!placeId || !jobId) return null;
    return `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${jobId}`;
  };

  const profileUrl = (userId: number) => `https://www.roblox.com/users/${userId}/profile`;
  const avatarUrl = (userId: number) => avatarMap[userId] || headshotApiUrl(userId);
  const handleSelectServer = useCallback((id: string) => setSelectedServerId(id), []);
  const handleStartDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const roleEntries = summary?.onlineByRole ? Object.entries(summary.onlineByRole) : [];

  const getStaffHighlight = (rank?: string | null): { color?: string; icon?: string } => {
    if (!rank) return {};
    const r = rank.toLowerCase();
    if (r.includes("founder")) {
      return { color: "#ef4444", icon: "👑" };
    }
    if (r.includes("chief of staff")) {
      return { color: "#38bdf8", icon: "👔" };
    }
    if (r.includes("developer")) {
      return { color: "#f97316", icon: "🔨" };
    }
    if (r.includes("lead supervisor")) {
      return { color: "#22c55e", icon: "🛡" };
    }
    if (r.includes("senior supervisor")) {
      return { color: "#22c55e", icon: "🛡" };
    }
    if (r.includes("supervisor")) {
      return { color: "#22c55e", icon: "🛡" };
    }
    return {};
  };

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

  useEffect(() => {
    if (!highlightedPlayerId || !selectedRowRef.current) return;
    selectedRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedPlayerId]);

  const avatarSrc = user?.avatarUrl;
  const avatarFallback = user?.username?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="dashboard">
      <style>{globalStyles}</style>
      <header className="header">
        <div>
          <p className="eyebrow">Network Dashboard</p>
          <h1>Operations Pulse</h1>
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
              {avatarSrc ? (
                <img src={avatarSrc} alt={`${user?.username} avatar`} className="account-avatar" />
              ) : (
                <div className="avatar-fallback">{avatarFallback}</div>
              )}
              <span className="account-name">{user?.username}</span>
            </button>
            {isAccountOpen && (
              <div className="account-dropdown">
                <button
                  className="account-item"
                  onClick={() => {
                    setIsAccountOpen(false);
                    onNavigate?.("/settings");
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

      {error && <div className="alert">Error: {error}</div>}

      <section className="stats">
        <StatCard
          label="Players Online"
          value={summary?.onlineTotal ?? 0}
          accent="var(--accent-green)"
        />
        <StatCard
          label="Servers Online"
          value={summary?.serversOnline ?? 0}
          accent="var(--accent-blue)"
        />
        <StatCard
          label="Last Updated"
          value={formatDate(summary?.lastUpdated)}
          accent="var(--accent-purple)"
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Online by Role</h2>
          <p className="muted">Snapshot of active roles across all servers.</p>
        </div>
        <div className="role-grid">
          {roleEntries.length > 0 &&
            roleEntries.map(([role, count]) => (
              <div key={role} className="role-card">
                <span className="role-name">{role}</span>
                <span className="role-count">{count}</span>
              </div>
            ))}
          {!loading && roleEntries.length === 0 && (
            <p className="muted">No role data available.</p>
          )}
        </div>
      </section>

      <div
        className="content-grid"
        ref={contentGridRef}
        style={{
          gridTemplateColumns: `minmax(240px, ${split}fr) 12px minmax(0, ${(1 - split).toFixed(
            2
          )}fr)`,
        }}
      >
        <section className="panel panel-servers">
          <div className="panel-header">
            <h2>Servers & Players</h2>
            <p className="muted">Players grouped by the servers they are on.</p>
          </div>
          <div className="server-grid">
            {loading && <p className="muted">Loading servers...</p>}
            {!loading && (!playersState?.servers || playersState.servers.length === 0) && (
              <p className="muted">No servers online right now.</p>
            )}
            {!loading &&
              playersState?.servers?.map((server) => {
                const joinUrl = getJoinUrl(server);
                const isSelected = selectedServerId === server.serverId;
                return (
                  <div className={`server-card ${isSelected ? "server-card-selected" : ""}`} key={server.serverId}>
                    <div className="server-header">
                      <div>
                        <p className="muted">Server</p>
                        <h3>{shortenServerId(server.serverId)}</h3>
                        <p className="muted small">Updated {formatDate(server.updatedAt)}</p>
                      </div>
                      <div className="server-actions">
                        <button className="view-map" onClick={() => handleSelectServer(server.serverId)}>
                          View Map
                        </button>
                        {joinUrl ? (
                          <a className="join-button" href={joinUrl}>
                            Join
                          </a>
                        ) : (
                          <span className="muted small">Join unavailable</span>
                        )}
                      </div>
                    </div>
                    <div className="player-list">
                      {server.players && server.players.length > 0 ? (
                        server.players.map((player) => {
                          const isHighlighted = highlightedPlayerId === player.userId;
                          const { color: usernameColor, icon: roleIcon } = getStaffHighlight(
                            player.rank
                          );
                          return (
                            <div
                              className={`player-row ${
                                isHighlighted ? "player-row--selected" : ""
                              }`}
                              key={`${server.serverId}-${player.userId}`}
                              ref={isHighlighted ? selectedRowRef : undefined}
                              onClick={() =>
                                handleSelectPlayer((current) =>
                                  current === player.userId ? null : player.userId
                                )
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
                                  style={usernameColor ? { color: usernameColor } : undefined}
                                >
                                  {roleIcon && (
                                    <span className="role-icon" aria-hidden="true">
                                      {roleIcon}
                                    </span>
                                  )}
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
                  </div>
                );
              })}
          </div>
        </section>

        <div
          className={`resize-handle ${dragging ? "dragging" : ""}`}
          onMouseDown={handleStartDrag}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
        />

        <section className="panel map-panel">
          <div className="panel-header">
            <h2>Live Map</h2>
            <p className="muted">Player positions (select server).</p>
          </div>
          <MapView
            servers={playersState?.servers || []}
            selectedServerId={selectedServerId}
            onSelect={handleSelectServer}
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

const StatCard: React.FC<{ label: string; value: number | string; accent: string }> = ({
  label,
  value,
  accent,
}) => {
  return (
    <div className="stat-card">
      <div className="stat-indicator" style={{ background: accent }} />
      <div>
        <p className="muted">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
};

type MapViewProps = {
  servers: Server[];
  selectedServerId: string | null;
  highlightedPlayerId: number | null;
  onSelect: (id: string) => void;
  onSelectPlayer?: (value: number | null | ((prev: number | null) => number | null)) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onExitFullscreen?: () => void;
};

const teamColorPalette: Record<string, string> = {
  "Bus Operator": "#f0b232",
  Choosing: "#6b8bff",
  Civilian: "#7dd3fc",
  Passenger: "#9cfab6",
  "Transit Police": "#4ad295",
};

const TRANSIT_POLICE_COLOR = "#00A8FF";
const CHOOSING_COLOR = "#A0A0A0";

const MapView: React.FC<MapViewProps> = ({
  servers,
  selectedServerId,
  onSelect,
  highlightedPlayerId,
  onSelectPlayer,
  isFullscreen = false,
  onToggleFullscreen,
  onExitFullscreen,
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  type DotSize = "small" | "medium" | "large";
  const DOT_SIZE_KEY = "net-dashboard.dotSize";
  const ZOOM_TO_CURSOR_KEY = "net-dashboard.zoomToCursor";
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4;
  const ZOOM_FACTOR = 1.1;
  const [dotSize, setDotSize] = useState<DotSize>("medium");
  const [showSettings, setShowSettings] = useState(false);
  const [zoomToCursor, setZoomToCursor] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const zoomRef = useRef(zoom);

  const centerOffsetFor = useCallback(
    (z: number, width?: number, height?: number) => {
      const w = width ?? viewportSize.width;
      const h = height ?? viewportSize.height;
      if (!w || !h) return { x: 0, y: 0 };
      return {
        x: (w - w * z) / 2,
        y: (h - h * z) / 2,
      };
    },
    [viewportSize.width, viewportSize.height]
  );

  const zoomAtPoint = useCallback(
    (factor: number, origin?: { x: number; y: number }) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      const originX = origin?.x ?? (rect?.width ? rect.width / 2 : 0);
      const originY = origin?.y ?? (rect?.height ? rect.height / 2 : 0);

      setZoom((prevZoom) => {
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom * factor));
        const zoomRatio = nextZoom / prevZoom;
        if (nextZoom === prevZoom) return prevZoom;

        setOffset((prevOffset) => ({
          x: originX - (originX - prevOffset.x) * zoomRatio,
          y: originY - (originY - prevOffset.y) * zoomRatio,
        }));

        return nextZoom;
      });
    },
    [MAX_ZOOM, MIN_ZOOM]
  );

  useEffect(() => {
    if (!selectedServerId && servers[0]) {
      onSelect(servers[0].serverId);
    }
  }, [servers, selectedServerId, onSelect]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DOT_SIZE_KEY);
      if (saved === "small" || saved === "medium" || saved === "large") {
        setDotSize(saved);
      }
      const savedZoomToCursor = localStorage.getItem(ZOOM_TO_CURSOR_KEY);
      if (savedZoomToCursor === "true") setZoomToCursor(true);
      if (savedZoomToCursor === "false") setZoomToCursor(false);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DOT_SIZE_KEY, dotSize);
      localStorage.setItem(ZOOM_TO_CURSOR_KEY, String(zoomToCursor));
    } catch {
      // ignore
    }
  }, [dotSize, zoomToCursor]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateSize = () =>
      setViewportSize({ width: el.clientWidth, height: el.clientHeight });

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isFullscreen]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    if (!viewportSize.width || !viewportSize.height) return;
    setOffset(centerOffsetFor(zoomRef.current, viewportSize.width, viewportSize.height));
  }, [viewportSize.width, viewportSize.height, isFullscreen, centerOffsetFor]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const originX = zoomToCursor ? e.clientX - rect.left : rect.width / 2;
      const originY = zoomToCursor ? e.clientY - rect.top : rect.height / 2;
      const zoomFactor = e.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;

      zoomAtPoint(zoomFactor, { x: originX, y: originY });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [zoomToCursor, zoomAtPoint]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onExitFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, onExitFullscreen]);

  const currentServer = servers.find((s) => s.serverId === selectedServerId) || servers[0];
  const playersWithPos =
    currentServer?.players?.filter(
      (p) => p.position?.mapX !== null && p.position?.mapY !== null
    ) || [];

  const colorFor = (player: Player) => {
    if (player.team === "Transit Police") return TRANSIT_POLICE_COLOR;
    if (player.team === "Choosing") return CHOOSING_COLOR;
    if (player.teamColor) return player.teamColor;
    return teamColorPalette[player.team] || "#6a6adf";
  };

  const handleDotClick = (player: Player) => {
    if (!onSelectPlayer) return;
    onSelectPlayer((current) => (current === player.userId ? null : player.userId));
  };

  const hasServers = servers.length > 0;
  const dotSizePx = dotSize === "small" ? 8 : dotSize === "large" ? 14 : 11;
  const viewportWidth = viewportSize.width || viewportRef.current?.clientWidth || 0;
  const viewportHeight = viewportSize.height || viewportRef.current?.clientHeight || 0;

  const mapContent = (
    <div className="map-wrapper">
      <div className="map-toolbar">
        <label className="muted small" htmlFor="server-select">
          Server
        </label>
        <select
          id="server-select"
          value={currentServer?.serverId || ""}
          onChange={(e) => onSelect(e.target.value)}
          className="map-select"
        >
          {servers.map((s) => (
            <option key={s.serverId} value={s.serverId}>
              {shortenServerId(s.serverId)}
            </option>
          ))}
        </select>
      </div>
      <div className="map-container">
        <div
          className="map-viewport"
          ref={viewportRef}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            const target = e.target as HTMLElement;
            if (target.closest(".map-controls") || target.closest(".map-settings")) return;
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
          }}
          onMouseMove={(e) => {
            if (!isDragging || !dragStart) return;
            setOffset({
              x: e.clientX - dragStart.x,
              y: e.clientY - dragStart.y,
            });
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div
            className="map-inner"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && onSelectPlayer) {
                onSelectPlayer(null);
              }
            }}
          >
            <img src={netMap} alt="Live map" className="map-image" draggable={false} />
          </div>
          <div className="map-overlay">
            {!hasServers && (
              <div className="muted small map-empty">No servers available.</div>
            )}
            {playersWithPos.map((player) => {
              const mapX = player.position?.mapX ?? 0;
              const mapY = player.position?.mapY ?? 0;
              const worldX = mapX * viewportWidth;
              const worldY = mapY * viewportHeight;
              const screenX = offset.x + worldX * zoom;
              const screenY = offset.y + worldY * zoom;
              const isPassenger = player.role === "Passenger" || player.team === "Passenger";
              return (
                <div
                  key={player.userId}
                  className="map-dot-wrapper"
                  style={{
                    left: `${screenX}px`,
                    top: `${screenY}px`,
                    transform: `translate(-50%, -50%)`,
                    transformOrigin: "center",
                  }}
                >
                  <div
                    className={`map-dot ${isPassenger ? "passenger" : ""} ${
                      highlightedPlayerId === player.userId ? "selected" : ""
                    }`}
                    style={{
                      width: `${dotSizePx}px`,
                      height: `${dotSizePx}px`,
                      background: isPassenger ? "#ffffff" : colorFor(player),
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDotClick(player);
                    }}
                    onMouseEnter={() => setHovered(player.userId)}
                    onMouseLeave={() =>
                      setHovered((prev) => (prev === player.userId ? null : prev))
                    }
                  />
                  {hovered === player.userId && (
                    <div className="map-tooltip">
                      <div className="tooltip-row">
                        <span className="username-link">{player.username}</span>
                        <span className="muted small">{player.displayName}</span>
                      </div>
                        <div className="tooltip-row">
                          <span
                            className="pill"
                            style={
                              player.team === "Transit Police"
                                ? {
                                    backgroundColor: "rgba(0, 168, 255, 0.15)",
                                    border: "1px solid #00A8FF",
                                    color: "var(--text)",
                                    WebkitTextStroke: "0.5px #00A8FF",
                                  }
                                : player.team === "Choosing"
                                ? {
                                    backgroundColor: "rgba(160, 160, 160, 0.15)",
                                    border: "1px solid #A0A0A0",
                                    color: "#A0A0A0",
                                  }
                                : undefined
                            }
                          >
                            {player.role || player.team || "-"}
                          </span>
                          <span className="pill">{player.rank ?? "-"}</span>
                        </div>
                      <div className="tooltip-row">
                        <span className="pill">Miles {player.miles ?? 0}</span>
                        <span className="pill">Cash {player.cash ?? 0}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {playersWithPos.length === 0 && hasServers && (
              <div className="muted small map-empty">No player coordinates for this server.</div>
            )}
          </div>
          <div className="map-controls">
            <button onClick={() => zoomAtPoint(ZOOM_FACTOR, { x: viewportWidth / 2, y: viewportHeight / 2 })}>+</button>
            <button onClick={() => zoomAtPoint(1 / ZOOM_FACTOR, { x: viewportWidth / 2, y: viewportHeight / 2 })}>−</button>
            <button
              onClick={() => {
                setZoom(1);
                setOffset(centerOffsetFor(1));
              }}
              title="Reset view"
            >
              ⟳
            </button>
            <button
              onClick={onToggleFullscreen}
              title={isFullscreen ? "Exit full screen" : "Full screen"}
            >
              ⛶
            </button>
            <button onClick={() => setShowSettings((v) => !v)} title="Map settings">
              ⚙
            </button>
          </div>
          {showSettings && (
            <div className="map-settings">
              <div className="map-settings-row">
                <span>Zoom to cursor</span>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={zoomToCursor}
                    onChange={(e) => setZoomToCursor(e.target.checked)}
                  />
                </label>
              </div>
              <div className="map-settings-row">
                <span>Dot size</span>
                <select
                  value={dotSize}
                  onChange={(e) => setDotSize(e.target.value as DotSize)}
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="map-fullscreen-overlay" onClick={onExitFullscreen}>
        <div className="map-fullscreen-inner" onClick={(e) => e.stopPropagation()}>
          {mapContent}
        </div>
      </div>
    );
  }

  return mapContent;
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

  :root {
    --bg: radial-gradient(circle at 15% 20%, #162240 0, transparent 30%), radial-gradient(circle at 85% 0%, #1b2a4f 0, transparent 25%), #0b0f1e;
    --panel: #11182d;
    --panel-strong: #0c1225;
    --text: #eaf0ff;
    --muted: #7d8cab;
    --border: #1f2740;
    --accent-blue: linear-gradient(120deg, #2ca7ff, #4b7cff);
    --accent-green: linear-gradient(120deg, #4ad295, #2ea17c);
    --accent-purple: linear-gradient(120deg, #9b8cff, #6a6adf);
    --shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Space Grotesk', 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--text);
  }

  .dashboard {
    min-height: 100vh;
    padding: 32px clamp(16px, 3vw, 64px);
    background: var(--bg);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 12px;
    color: var(--muted);
    margin: 0 0 6px 0;
  }

  h1 {
    margin: 0;
    font-size: clamp(28px, 4vw, 40px);
    line-height: 1.1;
  }

  h2 {
    margin: 0;
    font-size: 18px;
  }

  h3 {
    margin: 4px 0 2px 0;
    font-size: 16px;
  }

  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 999px;
    box-shadow: var(--shadow);
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(120deg, #4ad295, #2ea17c);
    box-shadow: 0 0 12px #2ea17c;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .account-menu {
    position: relative;
  }

  .account-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 999px;
    background: var(--panel);
    border: 1px solid var(--border);
    color: var(--text);
    cursor: pointer;
    box-shadow: var(--shadow);
  }

  .account-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid var(--border);
  }

  .avatar-fallback {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: #1f2740;
    border: 1px solid var(--border);
    font-weight: 700;
    color: var(--text);
  }

  .account-name {
    font-weight: 600;
  }

  .account-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
    overflow: hidden;
    min-width: 160px;
    z-index: 50;
  }

  .account-item {
    width: 100%;
    padding: 10px 12px;
    background: transparent;
    color: var(--text);
    border: none;
    text-align: left;
    cursor: pointer;
  }

  .account-item:hover {
    background: rgba(255,255,255,0.05);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .content-grid {
    display: grid;
    grid-template-columns: minmax(240px, 0.35fr) 12px minmax(0, 0.65fr);
    gap: 12px;
    align-items: start;
    position: relative;
  }

  .stat-card {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: center;
    padding: 16px;
    background: var(--panel);
    border-radius: 16px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
  }

  .stat-indicator {
    width: 8px;
    height: 56px;
    border-radius: 6px;
  }

  .stat-value {
    margin: 4px 0 0 0;
    font-size: 24px;
    font-weight: 600;
  }

  .panel {
    background: linear-gradient(180deg, var(--panel), var(--panel-strong));
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: var(--shadow);
  }

  .content-grid .panel {
    margin-bottom: 0;
    height: auto;
    align-self: start;
    min-height: 0;
  }

  .panel-servers {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 260px);
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 12px;
  }

  .muted {
    color: var(--muted);
    margin: 0;
    font-size: 14px;
  }

  .role-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }

  .role-card {
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .role-name {
    font-weight: 500;
  }

  .role-count {
    font-size: 20px;
    font-weight: 600;
  }

  .server-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .server-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .server-card-selected {
    border-color: var(--accent-blue);
    box-shadow: 0 0 0 1px rgba(76, 169, 255, 0.3), var(--shadow);
  }

  .map-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-self: start;
    min-height: 0;
  }

  .map-wrapper {
    width: 100%;
    max-width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: center;
    align-items: center;
  }

  .map-container {
    width: 100%;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 15469 / 9504; /* Matches net-map.png dimensions */
    overflow: hidden;
    position: relative;
    background: #000;
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: var(--shadow);
  }

  .map-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .map-select {
    background: rgba(255, 255, 255, 0.05);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 8px 10px;
  }

  .map-viewport {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    overflow: hidden;
    background: #050814;
    overscroll-behavior: contain;
  }

  .map-inner {
    position: relative;
    width: 100%;
    height: 100%;
    cursor: grab;
    will-change: transform;
  }

  .map-inner:active {
    cursor: grabbing;
  }

  .map-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .map-dot-wrapper {
    position: absolute;
    pointer-events: auto;
  }

  .map-image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
  }

  .map-dot {
    position: absolute;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0,0,0,0.5);
    cursor: pointer;
    border: 1px solid #0b0f1e;
  }

  .map-dot.passenger {
    width: 12px;
    height: 12px;
    background: #ffffff !important;
    border-color: #ffffff;
    box-shadow: 0 0 0 rgba(0,0,0,0);
  }

  .map-tooltip {
    position: absolute;
    left: 14px;
    top: 14px;
    background: rgba(11, 15, 30, 0.92);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px;
    min-width: 180px;
    z-index: 2;
    box-shadow: var(--shadow);
  }

  .tooltip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-bottom: 4px;
  }

  .map-empty {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0,0,0,0.35);
    pointer-events: none;
  }

  .map-controls {
    position: absolute;
    right: 12px;
    top: 12px;
    z-index: 20;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .map-controls button {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: rgba(10, 16, 40, 0.9);
    color: #fff;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .map-dot.selected {
    box-shadow: 0 0 0 2px #1d4ed8, 0 0 12px rgba(59,130,246,0.8);
  }

  .map-settings {
    position: absolute;
    right: 52px;
    top: 12px;
    z-index: 25;
    pointer-events: auto;
    min-width: 180px;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid rgba(148,163,184,0.45);
    background: rgba(15,23,42,0.98);
    box-shadow: 0 18px 40px rgba(0,0,0,0.7);
    font-size: 13px;
  }

  .map-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .map-settings select {
    background: #020617;
    border-radius: 999px;
    border: 1px solid rgba(148,163,184,0.6);
    color: #e5e7eb;
    padding: 4px 10px;
    font-size: 13px;
  }

  .map-settings input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #4b7cff;
    cursor: pointer;
  }

  .map-fullscreen-overlay {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: radial-gradient(circle at top, rgba(15,23,42,0.95), rgba(2,6,23,0.98));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .map-fullscreen-inner {
    width: min(96vw, 1600px);
    height: min(90vh, 900px);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 25px 80px rgba(0,0,0,0.6);
    border: 1px solid rgba(148,163,184,0.35);
    background: #020617;
  }

  .map-fullscreen-inner .map-wrapper {
    height: 100%;
    justify-content: center;
  }

  .map-fullscreen-inner .map-container {
    height: 100%;
    width: auto;
    max-width: 100%;
    aspect-ratio: 15469 / 9504;
    margin: 0 auto;
  }

  .map-fullscreen-inner .map-viewport {
    height: 100%;
  }

  .server-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .server-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .view-map {
    padding: 10px 12px;
    background: rgba(76, 169, 255, 0.15);
    color: var(--text);
    font-weight: 600;
    border-radius: 10px;
    border: 1px solid var(--border);
    cursor: pointer;
  }

  .join-button {
    padding: 10px 14px;
    background: var(--accent-blue);
    color: #0b0f1e;
    font-weight: 600;
    border-radius: 10px;
    border: none;
    text-decoration: none;
    box-shadow: var(--shadow);
  }

  .player-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .player-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.2);
  }

  .player-row--selected {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
    background: radial-gradient(circle at 0 0, rgba(59,130,246,0.25), transparent 50%), var(--panel);
  }

  .player-main {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 180px;
  }

  .avatar {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    border: 1px solid var(--border);
    object-fit: cover;
    background: #0b0f1e;
  }

  .username-link {
    color: var(--text);
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
  }

  .username-link:hover {
    text-decoration: underline;
  }

  .role-icon {
    font-size: 0.9em;
  }

  .player-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
  }

  .pill {
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 12px;
    color: var(--text);
  }

  .small {
    font-size: 12px;
  }

  .profile-card {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .profile-avatar {
    width: 90px;
    height: 90px;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: #0b0f1e;
    display: grid;
    place-items: center;
  }

  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .profile-meta h2 {
    margin: 0;
  }

  .permissions-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .permission-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: rgba(255,255,255,0.03);
  }

  .permission-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .avatar-fallback.large {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    font-size: 32px;
  }

  .alert {
    margin-bottom: 16px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid #ff6b6b33;
    background: #31101a;
    color: #ffb5b5;
  }

  .resize-handle {
    width: 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--border);
    cursor: col-resize;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .resize-handle:hover,
  .resize-handle.dragging {
    background: rgba(76, 169, 255, 0.15);
    border-color: rgba(76, 169, 255, 0.5);
  }

  @media (max-width: 720px) {
    .header {
      flex-direction: column;
      align-items: flex-start;
    }

    .panel-header {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;

export default DashboardPage;
