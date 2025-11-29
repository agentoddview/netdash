import React from "react";
import type { Player } from "./dashboard";
import { getStaffHighlight } from "./dashboard";
import { ModActionButton } from "./components/moderation/ModActionButton";
import { nameColorForPlayer } from "./utils/nameColor";
import { Avatar } from "./components/Avatar";

type PlayerRowProps = {
  player: Player;
  avatarUrl: (userId: number) => string;
  profileUrl: (userId: number) => string;
  serverId: string;
  isHighlighted?: boolean;
  onSelect?: () => void;
  selectedRef?: React.RefObject<HTMLDivElement | null> | null;
};

const PlayerRow: React.FC<PlayerRowProps> = ({
  player,
  avatarUrl,
  profileUrl,
  serverId,
  isHighlighted,
  onSelect,
  selectedRef,
}) => {
  const { color: highlightColor, icon: roleIcon } = getStaffHighlight(player.rank);
  const nameColor =
    nameColorForPlayer({ groupRank: player.rank ? Number(player.rank) : undefined, role: player.role }) ||
    highlightColor;

  return (
    <div
      className={`player-row ${isHighlighted ? "player-row--selected" : ""}`}
      ref={isHighlighted ? (selectedRef as React.RefObject<HTMLDivElement | null>) : null}
      onClick={onSelect}
    >
      <div className="player-main">
        <Avatar src={avatarUrl(player.userId)} alt={`${player.username} avatar`} className="avatar" />
        <div>
          <a
            href={profileUrl(player.userId)}
            target="_blank"
            rel="noreferrer"
            className="username-link"
            style={nameColor ? { color: nameColor } : undefined}
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
      <div className="player-actions">
        <ModActionButton player={player} serverId={serverId} />
      </div>
      <div className="player-tags">
        <span className="pill">{player.role || player.team || "-"}</span>
        <span className="pill">{player.rank ?? "-"}</span>
        <span className="pill">Miles {player.miles ?? 0}</span>
        <span className="pill">Cash {player.cash ?? 0}</span>
      </div>
    </div>
  );
};

export default PlayerRow;
