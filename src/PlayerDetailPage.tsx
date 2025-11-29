import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "./components/AppShell";
import LiveMap from "./LiveMap";
import { Avatar } from "./components/Avatar";
import { globalStyles, type Player, type Server } from "./dashboard";
import { usePlayerDetail } from "./hooks/usePlayerDetail";
import { useAvatar } from "./hooks/useAvatar";
import { useLivePlayers } from "./hooks/useLivePlayers";
import { buildJoinUrl } from "./utils/joinUrl";
import { groupRankLabel, nameColorForPlayer } from "./utils/nameColor";

const formatPlayTime = (totalSeconds: number) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
};

const formatDate = (value: string | null) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const PlayerDetailPage: React.FC = () => {
  const { robloxUserId } = useParams<{ robloxUserId: string }>();
  const playerId = Number(robloxUserId);
  const navigate = useNavigate();
  const { data, loading, error, refetch } = usePlayerDetail(robloxUserId ?? "");
  const { avatarUrl } = useAvatar(playerId);
  const { data: livePlayers, loading: liveLoading } = useLivePlayers();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);

  useEffect(() => {
    if (data?.currentServer?.id) {
      setSelectedServerId(data.currentServer.id);
    }
  }, [data?.currentServer?.id]);

  const liveServerForPlayer = useMemo(() => {
    if (!livePlayers?.servers?.length || !Number.isFinite(playerId)) return null;
    return livePlayers.servers.find((server) =>
      (server.players || []).some((p) => p.userId === playerId)
    );
  }, [livePlayers, playerId]);

  const mapServers: Server[] = useMemo(() => {
    if (liveServerForPlayer) {
      const playersForServer = (liveServerForPlayer.players || []).filter((p) => p.userId === playerId);
      return [{ ...liveServerForPlayer, players: playersForServer }];
    }

    if (data?.currentStats && data.currentServer && Number.isFinite(playerId)) {
      const position = data.currentStats.position;
      const fallbackPlayer: Player = {
        userId: playerId,
        username: data.username,
        displayName: data.displayName,
        role: data.currentStats.role || "",
        team: data.currentStats.role || "Passenger",
        teamColor: null,
        rank: String(data.groupRank),
        miles: data.currentStats.miles ?? null,
        cash: data.currentStats.cash ?? null,
        status: data.isOnline ? "Online" : "Offline",
        joinedAt: data.lastSeenAt,
        position: position
          ? {
              worldX: position.x ?? null,
              worldZ: position.z ?? null,
              mapX: position.x ?? null,
              mapY: position.z ?? null,
            }
          : null,
      };

      const server: Server = {
        serverId: data.currentServer.id,
        placeId: data.currentServer.placeId,
        jobId: data.currentServer.jobId,
        updatedAt: data.lastSeenAt,
        players: [fallbackPlayer],
      };
      return [server];
    }

    return [];
  }, [data, liveServerForPlayer, playerId]);

  useEffect(() => {
    if (!selectedServerId && mapServers[0]) {
      setSelectedServerId(mapServers[0].serverId);
    }
  }, [mapServers, selectedServerId]);

  if (loading) {
    return (
      <div className="dashboard">
        <style>{globalStyles}</style>
        <p className="muted" style={{ textAlign: "center" }}>
          Loading player...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard">
        <style>{globalStyles}</style>
        <p className="muted" style={{ textAlign: "center" }}>
          {error || "Player not found."}
        </p>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button className="view-map" onClick={() => navigate("/players")}>
            Back to players
          </button>
          <button className="view-map" style={{ marginLeft: 8 }} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const color = nameColorForPlayer({
    groupRank: data.groupRank,
    role: data.currentStats?.role ?? null,
    hasAccount: data.hasAccount,
  });
  const isOnline = data.isOnline && !!data.currentServer;
  const onlineChip = isOnline
    ? `Online - ${data.currentServer?.name || data.currentServer?.id || "-"}`
    : `Offline - Last seen ${formatDate(data.lastSeenAt)}`;

  return (
    <AppShell
      headerProps={{
        activeTab: "players",
        showLiveDot: true,
        liveLabel: liveLoading ? "Syncing" : "Live",
        title: "Player detail",
      }}
      styles={globalStyles}
    >
      <div style={{ marginBottom: 12 }}>
        <button className="view-map" onClick={() => navigate("/players")}>
          Back to players
        </button>
      </div>

      <section className="panel">
        <div className="panel-header" style={{ alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar
              src={avatarUrl ?? ""}
              alt={`${data.displayName} avatar`}
              className="avatar"
              style={{ width: 72, height: 72, borderRadius: 18 }}
            />
            <div>
              <h2 style={{ margin: 0, color: color ?? "inherit" }}>{data.displayName}</h2>
              <p className="muted small" style={{ marginTop: 4 }}>
                <a
                  href={`https://www.roblox.com/users/${data.robloxUserId}/profile`}
                  target="_blank"
                  rel="noreferrer"
                  className="username-link"
                >
                  @{data.username}
                </a>
              </p>
              <p className="muted small">{groupRankLabel(data.groupRank)}</p>
              <p className="muted small">
                Dashboard account: {data.hasAccount ? "Linked" : "Not linked"}
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <span className="pill">Rank {data.groupRank}</span>
                <span
                  className="pill"
                  style={{
                    background: isOnline ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.2)",
                    color: isOnline ? "#22c55e" : "inherit",
                  }}
                >
                  {onlineChip}
                </span>
                {isOnline && data.currentServer?.id && (
                  <button
                    className="view-map"
                    onClick={() => navigate(`/servers/${data.currentServer?.id}`)}
                  >
                    View server
                  </button>
                )}
                {isOnline && data.currentServer?.placeId && data.currentServer?.jobId && (
                  <button
                    className="join-button"
                    onClick={() => {
                      const url = buildJoinUrl(data.currentServer?.placeId, data.currentServer?.jobId);
                      if (url) window.location.href = url;
                    }}
                  >
                    Join server
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="role-grid">
        <div className="role-card">
          <p className="muted small">Total play time</p>
          <h3>{formatPlayTime(data.totalPlayTimeSeconds)}</h3>
        </div>
        <div className="role-card">
          <p className="muted small">Last cash</p>
          <h3>{data.lastCash.toLocaleString()}</h3>
        </div>
        <div className="role-card">
          <p className="muted small">Group rank</p>
          <h3>{data.groupRank}</h3>
        </div>
        <div className="role-card">
          <p className="muted small">Last seen</p>
          <h3>{formatDate(data.lastSeenAt)}</h3>
        </div>
      </div>

      {isOnline && data.currentStats && (
        <section className="panel map-panel">
          <div className="panel-header">
            <div>
              <p className="muted small">Current session</p>
              <h3 style={{ margin: 0 }}>{data.currentServer?.name || data.currentServer?.id || "-"}</h3>
            </div>
          </div>
          <div className="role-grid">
            <div className="role-card">
              <p className="muted small">Role</p>
              <h3>{data.currentStats.role || "Unknown"}</h3>
            </div>
            <div className="role-card">
              <p className="muted small">Cash</p>
              <h3>{data.currentStats.cash.toLocaleString()}</h3>
            </div>
            <div className="role-card">
              <p className="muted small">Miles</p>
              <h3>{data.currentStats.miles.toLocaleString()}</h3>
            </div>
          </div>

          {mapServers.length > 0 ? (
            <LiveMap
              servers={mapServers}
              selectedServerId={selectedServerId}
              highlightedPlayerId={playerId}
              onSelect={(id) => setSelectedServerId(id)}
              formatServerId={(id) => data.currentServer?.name || id}
            />
          ) : (
            <p className="muted">No map data available for this player.</p>
          )}
        </section>
      )}
    </AppShell>
  );
};

export default PlayerDetailPage;
