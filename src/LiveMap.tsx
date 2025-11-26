import React, { useCallback, useEffect, useRef, useState } from "react";
import netMap from "./assets/net-map.png";
import type { Player, Server } from "./dashboard";

export type LiveMapProps = {
  servers: Server[];
  selectedServerId: string | null;
  highlightedPlayerId: number | null;
  onSelect: (id: string) => void;
  onSelectPlayer?: (value: number | null | ((prev: number | null) => number | null)) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onExitFullscreen?: () => void;
  formatServerId?: (id: string) => string;
};

type DotSize = "small" | "medium" | "large";

const teamColorPalette: Record<string, string> = {
  "Bus Operator": "#f0b232",
  Choosing: "#6b8bff",
  Civilian: "#7dd3fc",
  Passenger: "#9cfab6",
  "Transit Police": "#4ad295",
};

const TRANSIT_POLICE_COLOR = "#00A8FF";
const CHOOSING_COLOR = "#A0A0A0";
const DOT_SIZE_KEY = "net-dashboard.dotSize";
const ZOOM_TO_CURSOR_KEY = "net-dashboard.zoomToCursor";
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_FACTOR = 1.1;

const defaultFormatServerId = (id: string) => {
  if (!id) return "-";
  const [, jobId] = id.split(":");
  const value = jobId || id;
  return value.length > 8 ? `${value.slice(0, 8)}...` : value;
};

const LiveMap: React.FC<LiveMapProps> = ({
  servers,
  selectedServerId,
  onSelect,
  highlightedPlayerId,
  onSelectPlayer,
  isFullscreen = false,
  onToggleFullscreen,
  onExitFullscreen,
  formatServerId,
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
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
    []
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
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DOT_SIZE_KEY, dotSize);
      localStorage.setItem(ZOOM_TO_CURSOR_KEY, String(zoomToCursor));
    } catch {
      // ignore storage errors
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
  const formatId = formatServerId ?? defaultFormatServerId;

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
              {formatId(s.serverId)}
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
                        <span className="pill">{player.role || player.team || "-"}</span>
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
            <button
              onClick={() =>
                zoomAtPoint(ZOOM_FACTOR, { x: viewportWidth / 2, y: viewportHeight / 2 })
              }
            >
              +
            </button>
            <button
              onClick={() =>
                zoomAtPoint(1 / ZOOM_FACTOR, { x: viewportWidth / 2, y: viewportHeight / 2 })
              }
            >
              −
            </button>
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
                <select value={dotSize} onChange={(e) => setDotSize(e.target.value as DotSize)}>
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

export default LiveMap;
