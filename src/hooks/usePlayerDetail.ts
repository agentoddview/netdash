import { useCallback, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL;

export interface PlayerDetail {
  robloxUserId: number;
  username: string;
  displayName: string;
  groupRank: number;
  totalPlayTimeSeconds: number;
  lastCash: number;
  lastSeenAt: string;
  isOnline: boolean;
  hasAccount: boolean;
  currentServer: {
    id: string;
    placeId: number;
    jobId: string;
    name: string;
  } | null;
  currentStats: {
    role: string;
    cash: number;
    miles: number;
    position?: { x: number; y: number; z: number } | null;
  } | null;
}

export function usePlayerDetail(robloxUserId: string | number | undefined): {
  data: PlayerDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (id: string | number, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/players/${id}`, { signal, credentials: "include" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with status ${res.status}`);
        }
        const json = (await res.json()) as PlayerDetail;
        if (signal?.aborted) return;
        setData(json);
      } catch (err) {
        if (signal?.aborted) return;
        console.error("usePlayerDetail error", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setData(null);
      } finally {
        if (signal?.aborted) return;
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (robloxUserId == null) return;

    void fetchDetail(robloxUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [robloxUserId]);

  const refetch = useCallback(async () => {
    if (robloxUserId == null) return;
    const controller = new AbortController();
    await fetchDetail(robloxUserId, controller.signal);
  }, [fetchDetail, robloxUserId]);

  return { data, loading, error, refetch };
}
