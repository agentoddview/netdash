import { useCallback, useEffect, useRef, useState } from "react";

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
  const idRef = useRef(robloxUserId);

  const fetchDetail = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      const id = idRef.current;
      if (!id) {
        setError("Missing player id");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/players/${id}`, { signal, credentials: "include" });
        if (!res.ok) {
          throw new Error("Failed to load player");
        }
        const json = (await res.json()) as PlayerDetail;
        if (signal?.aborted) return;
        setData(json);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load player");
        setData(null);
      } finally {
        if (signal?.aborted) return;
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    idRef.current = robloxUserId;
    const controller = new AbortController();
    void fetchDetail(controller.signal);
    return () => controller.abort();
  }, [robloxUserId, fetchDetail]);

  const refetch = useCallback(async () => {
    const controller = new AbortController();
    await fetchDetail(controller.signal);
  }, [fetchDetail]);

  return { data, loading, error, refetch };
}
