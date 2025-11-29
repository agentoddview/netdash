import React, { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
  serverName: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL;

const ServerModerationModal: React.FC<Props> = ({ isOpen, onClose, serverId, serverName }) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"announce" | "shutdown" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const post = async (path: string, body: unknown) => {
    setError(null);
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed with ${res.status}`);
    }
  };

  const handleAnnounce = async () => {
    setLoading("announce");
    try {
      await post("/moderation/server-announce", { serverId, message });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to send announcement");
    } finally {
      setLoading(null);
    }
  };

  const handleShutdown = async () => {
    if (
      !window.confirm("Are you sure you want to shut down this server? All players will be kicked.")
    ) {
      return;
    }
    setLoading("shutdown");
    try {
      await post("/moderation/server-shutdown", { serverId, message });
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to shut down server");
    } finally {
      setLoading(null);
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
              Server tools
            </p>
            <h3 style={{ margin: "4px 0 0 0" }}>{serverName}</h3>
            <p className="muted small" style={{ marginTop: 4 }}>
              Server ID: {serverId}
            </p>
          </div>
          <button className="mod-close" onClick={onClose} type="button" aria-label="Close modal">
            A-
          </button>
        </div>

        <div className="mod-message">
          <span className="muted small">Announcement message (optional)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message to show to everyone in this server…"
            rows={3}
          />
        </div>

        {error && (
          <p className="mod-error" role="alert">
            {error}
          </p>
        )}

        <div className="mod-actions">
          <button
            className="view-map"
            type="button"
            onClick={onClose}
            disabled={loading !== null}
            style={{ background: "transparent", color: "inherit" }}
          >
            Cancel
          </button>
          <button
            className="view-map"
            type="button"
            onClick={handleAnnounce}
            disabled={loading !== null}
          >
            {loading === "announce" ? "Sending…" : "Send announcement"}
          </button>
          <button
            className="join-button"
            type="button"
            onClick={handleShutdown}
            disabled={loading !== null}
            style={{ background: "#ef4444", color: "#0b0f1e" }}
          >
            {loading === "shutdown" ? "Shutting down…" : "Shutdown server"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServerModerationModal;
