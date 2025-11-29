import { useCallback, useEffect, useRef, useState } from "react";

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
  const latestQuery = useRef(query);

  const fetchPlayers = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      const searchTerm = latestQuery.current.trim();
      const url =
        searchTerm.length > 0
          ? `${API_BASE}/players/search?q=${encodeURIComponent(searchTerm)}`
          : `${API_BASE}/players/search`;

      try {
        const res = await fetch(url, { signal, credentials: "include" });
        if (!res.ok) {
          throw new Error("Failed to load players");
        }
        const json = (await res.json()) as PlayerSummary[];
        if (signal?.aborted) return;
        setData(json);
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load players");
        setData(null);
      } finally {
        if (signal?.aborted) return;
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    latestQuery.current = query;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetchPlayers(controller.signal);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, fetchPlayers]);

  const refetch = useCallback(async () => {
    const controller = new AbortController();
    await fetchPlayers(controller.signal);
  }, [fetchPlayers]);

  return { data, loading, error, refetch };
}
