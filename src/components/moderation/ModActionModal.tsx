import React, { useMemo, useState } from "react";
import { useModeration } from "../../useModeration";
import { useAuth } from "../../AuthGate";
import type { ModActionPlayer } from "./ModActionButton";

type ModActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  player: ModActionPlayer;
  serverId: string;
};

type ActionKey =
  | "kick"
  | "respawn"
  | "serverBan"
  | "globalBan"
  | "message"
  | "freeze"
  | "bring"
  | "teleportTo"
  | "alert";

export const ModActionModal: React.FC<ModActionModalProps> = ({ isOpen, onClose, player, serverId }) => {
  const { kick, respawn, serverBan, globalBan, message, freeze, bring, teleportTo, alert } = useModeration();
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const playerLabel = useMemo(() => player.displayName || player.username, [player.displayName, player.username]);
  const moderatorUserId = user?.robloxUserId;

  if (!isOpen) return null;

  const handleAction = async (action: ActionKey) => {
    setError(null);
    setSubmitting(true);
    try {
      if (action === "kick") {
        await kick(player.userId, serverId, reason || undefined, moderatorUserId);
      } else if (action === "respawn") {
        await respawn(player.userId, serverId, moderatorUserId);
      } else if (action === "serverBan") {
        await serverBan(player.userId, serverId, reason || undefined, moderatorUserId);
      } else if (action === "globalBan") {
        await globalBan(player.userId, serverId, reason || undefined, moderatorUserId);
      } else if (action === "freeze") {
        await freeze(player.userId, serverId, reason || undefined, moderatorUserId);
      } else if (action === "bring") {
        await bring(player.userId, serverId, reason || undefined, moderatorUserId);
      } else if (action === "teleportTo") {
        await teleportTo(player.userId, serverId, reason || undefined, moderatorUserId);
      } else if (action === "message") {
        const trimmed = msg.trim();
        if (!trimmed) {
          setError("Message cannot be empty.");
          setSubmitting(false);
          return;
        }
        await message(player.userId, serverId, trimmed, moderatorUserId);
        setMsg("");
      } else if (action === "alert") {
        const trimmed = msg.trim();
        if (!trimmed) {
          setError("Message cannot be empty.");
          setSubmitting(false);
          return;
        }
        await alert(player.userId, serverId, trimmed, moderatorUserId);
        setMsg("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit action.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mod-modal-overlay" onClick={onClose}>
      <div
        className="mod-modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="mod-modal-header">
          <div>
            <p className="muted small" style={{ margin: 0 }}>
              Moderation tools
            </p>
            <h3 style={{ margin: "4px 0 0 0" }}>
              {player.username}
              {player.displayName ? ` (${player.displayName})` : ""}
            </h3>
            <p className="muted small" style={{ marginTop: 4 }}>
              Server: {serverId}
            </p>
          </div>
          <button className="mod-close" onClick={onClose} type="button" aria-label="Close moderation modal">
            ×
          </button>
        </div>

        <label className="mod-field">
          <span className="muted small">Reason (optional)</span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter a reason"
          />
        </label>

        <div className="mod-actions">
          <button type="button" onClick={() => handleAction("kick")} disabled={submitting}>
            Kick
          </button>
          <button type="button" onClick={() => handleAction("respawn")} disabled={submitting}>
            Respawn
          </button>
          <button type="button" onClick={() => handleAction("serverBan")} disabled={submitting}>
            Server Ban
          </button>
          <button type="button" onClick={() => handleAction("globalBan")} disabled={submitting}>
            Global Ban
          </button>
        </div>

        <div className="mod-actions">
          <button type="button" onClick={() => handleAction("freeze")} disabled={submitting}>
            Freeze
          </button>
          <button type="button" onClick={() => handleAction("bring")} disabled={submitting}>
            Bring
          </button>
          <button type="button" onClick={() => handleAction("teleportTo")} disabled={submitting}>
            Teleport To
          </button>
          <button
            type="button"
            onClick={() => handleAction("alert")}
            disabled={submitting || !msg.trim()}
            title="Send server-wide alert"
          >
            Alert
          </button>
        </div>

        <div className="mod-message">
          <span className="muted small">Message Player</span>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder={`Send a message to ${playerLabel}`}
            rows={3}
          />
          <button type="button" onClick={() => handleAction("message")} disabled={submitting}>
            Send Message
          </button>
        </div>

        {error && (
          <p className="mod-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
