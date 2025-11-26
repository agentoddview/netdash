import { useEffect, useState } from "react";
import type { Player } from "./dashboard";

const API_BASE = import.meta.env.VITE_API_URL;
const headshotApiUrl = (userId: number) => `${API_BASE}/proxy/avatar/${userId}`;

export const useAvatarMap = (players: Player[]) => {
  const [avatarMap, setAvatarMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const userIds = Array.from(
      new Set(players.map((p) => p.userId).filter(Boolean).filter((id) => avatarMap[id] === undefined))
    );
    if (userIds.length === 0) return;

    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        userIds.map(async (id) => {
          try {
            const res = await fetch(headshotApiUrl(id), {
              cache: "no-store",
              credentials: "include",
              headers: { accept: "application/json" },
            });
            if (!res.ok) return [id, null] as const;
            const json = (await res.json()) as { imageUrl?: string };
            return [id, json.imageUrl || null] as const;
          } catch {
            return [id, null] as const;
          }
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
  }, [players, avatarMap]);

  const avatarUrl = (userId: number) => avatarMap[userId] || headshotApiUrl(userId);

  return { avatarMap, avatarUrl };
};
