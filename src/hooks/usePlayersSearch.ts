import { useCallback, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL;

export interface PlayerSummary {
  robloxUserId: number;
  username: string;
  displayName: string;
  groupRank: number;
  totalPlayTimeSeconds: number;
  lastCash: number;
  lastSeenAt: string;
  isOnline: boolean;
  currentServerId: string | null;
  currentRole: string | null;
  hasAccount: boolean;
}

export function usePlayersSearch(query: string): {
  data: PlayerSummary[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<PlayerSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(
    async (q: string, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
      try {
        const res = await fetch(`${API_BASE}/players/search${params}`, {
          signal,
          credentials: "include",
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with status ${res.status}`);
        }
        const json = (await res.json()) as PlayerSummary[] | { players?: PlayerSummary[] };
        if (signal?.aborted) return;
        if (Array.isArray(json)) {
          setData(json);
        } else {
          setData(json.players ?? []);
        }
      } catch (err) {
        if (signal?.aborted) return;
        console.error("usePlayersSearch error", err);
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
    const controller = new AbortController();
    void fetchPlayers(query, controller.signal);
    return () => controller.abort();
  }, [query, fetchPlayers]);

  const refetch = useCallback(async () => {
    const controller = new AbortController();
    await fetchPlayers(query, controller.signal);
  }, [fetchPlayers, query]);

  return { data, loading, error, refetch };
}
