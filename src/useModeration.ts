const API_BASE = import.meta.env.VITE_API_URL;

export type ModerationApi = {
  kick: (targetUserId: number, serverId?: string, reason?: string) => Promise<void>;
  respawn: (targetUserId: number, serverId?: string) => Promise<void>;
  serverBan: (targetUserId: number, serverId?: string, reason?: string) => Promise<void>;
  globalBan: (targetUserId: number, serverId?: string, reason?: string) => Promise<void>;
  message: (targetUserId: number, serverId: string | undefined, message: string) => Promise<void>;
};

const callModeration = async (
  action: string,
  payload: { targetUserId: number; serverId?: string; reason?: string; message?: string }
) => {
  const res = await fetch(`${API_BASE}/moderation/${action}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      detail = data.error || data.message || detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail || "Moderation request failed");
  }
};

export function useModeration(): ModerationApi {
  return {
    async kick(targetUserId, serverId, reason) {
      await callModeration("kick", { targetUserId, serverId, reason });
    },
    async respawn(targetUserId, serverId) {
      await callModeration("respawn", { targetUserId, serverId });
    },
    async serverBan(targetUserId, serverId, reason) {
      await callModeration("server-ban", { targetUserId, serverId, reason });
    },
    async globalBan(targetUserId, serverId, reason) {
      await callModeration("global-ban", { targetUserId, serverId, reason });
    },
    async message(targetUserId, serverId, message) {
      await callModeration("message", { targetUserId, serverId, message });
    },
  };
}
