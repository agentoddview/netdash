import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import { globalStyles, getStaffHighlight } from "./dashboard";
import { usePlayersSearch, type PlayerSummary } from "./hooks/usePlayersSearch";
import { useAvatar } from "./hooks/useAvatar";

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

type PlayerListItemProps = {
  player: PlayerSummary;
  onClick: () => void;
};

const PlayerListItem: React.FC<PlayerListItemProps> = ({ player, onClick }) => {
  const { avatarUrl } = useAvatar(player.robloxUserId);
  const { color } = getStaffHighlight(String(player.groupRank));
  const onlineChip = player.isOnline
    ? `Online - ${player.currentServerId ?? "-"}`
    : `Offline - Last seen ${formatDate(player.lastSeenAt)}`;

  return (
    <div
      className="player-row"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className="player-main">
        <img src={avatarUrl ?? ""} alt={`${player.displayName} avatar`} className="avatar" />
        <div>
          <div className="username-link" style={color ? { color } : undefined}>
            {player.displayName}
          </div>
          <p className="muted small">@{player.username}</p>
        </div>
      </div>
      <div className="player-tags" style={{ justifyContent: "flex-end" }}>
        <span className="pill">Rank {player.groupRank}</span>
        <span className="pill">Time {formatPlayTime(player.totalPlayTimeSeconds)}</span>
        <span className="pill">Cash {player.lastCash.toLocaleString()}</span>
        <span
          className="pill"
          style={{
            background: player.isOnline ? "rgba(34,197,94,0.15)" : "rgba(148,163,184,0.2)",
            color: player.isOnline ? "#22c55e" : "inherit",
          }}
        >
          {onlineChip}
        </span>
      </div>
    </div>
  );
};

const PlayersPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data, loading, error } = usePlayersSearch(search);

  const players = useMemo(() => data ?? [], [data]);

  return (
    <AppShell
      headerProps={{
        activeTab: "players",
        showLiveDot: true,
        liveLabel: loading ? "Syncing" : "Live",
        title: "Players",
      }}
      styles={globalStyles}
    >
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="muted small">Players</p>
            <h2>Players</h2>
            <p className="muted">Search and inspect player activity.</p>
          </div>
        </div>

        <div className="servers-search">
          <input
            type="text"
            placeholder="Search by username or display name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button aria-label="Search">dY"?</button>
        </div>

        {loading && <p className="muted">Loading players...</p>}
        {error && !loading && <p className="muted">Error: {error}</p>}

        {!loading && !error && players.length === 0 && (
          <p className="muted">No players found.</p>
        )}

        {!loading && !error && players.length > 0 && (
          <div className="player-list">
            {players.map((player) => (
              <PlayerListItem
                key={player.robloxUserId}
                player={player}
                onClick={() => navigate(`/players/${player.robloxUserId}`)}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
};

export default PlayersPage;
