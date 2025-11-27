const API_BASE = import.meta.env.VITE_API_URL;

export type ModerationAction = "kick" | "respawn" | "server-ban" | "global-ban" | "message" | "freeze" | "bring" | "to" | "alert";

export type ModerationPayload = {
  targetUserId: number;
  serverId?: string;
  moderatorUserId?: number;
  reason?: string | null;
  message?: string | null;
};

export type ModerationApi = {
  kick: (targetUserId: number, serverId?: string, reason?: string, moderatorUserId?: number) => Promise<void>;
  respawn: (targetUserId: number, serverId?: string, moderatorUserId?: number) => Promise<void>;
  serverBan: (targetUserId: number, serverId?: string, reason?: string, moderatorUserId?: number) => Promise<void>;
  globalBan: (targetUserId: number, serverId?: string, reason?: string, moderatorUserId?: number) => Promise<void>;
  message: (targetUserId: number, serverId: string | undefined, message: string, moderatorUserId?: number) => Promise<void>;
  freeze: (targetUserId: number, serverId?: string, reason?: string, moderatorUserId?: number) => Promise<void>;
  bring: (targetUserId: number, serverId?: string, reason?: string, moderatorUserId?: number) => Promise<void>;
  teleportTo: (targetUserId: number, serverId?: string, reason?: string, moderatorUserId?: number) => Promise<void>;
  alert: (targetUserId: number, serverId: string | undefined, message: string, moderatorUserId?: number) => Promise<void>;
};

const callModeration = async (action: ModerationAction, payload: ModerationPayload) => {
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
    async kick(targetUserId, serverId, reason, moderatorUserId) {
      await callModeration("kick", { targetUserId, serverId, reason: reason ?? null, moderatorUserId });
    },
    async respawn(targetUserId, serverId, moderatorUserId) {
      await callModeration("respawn", { targetUserId, serverId, moderatorUserId });
    },
    async serverBan(targetUserId, serverId, reason, moderatorUserId) {
      await callModeration("server-ban", { targetUserId, serverId, reason: reason ?? null, moderatorUserId });
    },
    async globalBan(targetUserId, serverId, reason, moderatorUserId) {
      await callModeration("global-ban", { targetUserId, serverId, reason: reason ?? null, moderatorUserId });
    },
    async message(targetUserId, serverId, message, moderatorUserId) {
      await callModeration("message", { targetUserId, serverId, message, moderatorUserId });
    },
    async freeze(targetUserId, serverId, reason, moderatorUserId) {
      await callModeration("freeze", { targetUserId, serverId, reason: reason ?? null, moderatorUserId });
    },
    async bring(targetUserId, serverId, reason, moderatorUserId) {
      await callModeration("bring", { targetUserId, serverId, reason: reason ?? null, moderatorUserId });
    },
    async teleportTo(targetUserId, serverId, reason, moderatorUserId) {
      await callModeration("to", { targetUserId, serverId, reason: reason ?? null, moderatorUserId });
    },
    async alert(targetUserId, serverId, message, moderatorUserId) {
      await callModeration("alert", { targetUserId, serverId, message, moderatorUserId });
    },
  };
}
