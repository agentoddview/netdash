import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState } from "../dashboard";

const API_BASE = import.meta.env.VITE_API_URL;

export function useLivePlayers(pollIntervalMs = 5000): {
  data: GameState | null;
  loading: boolean;
  error: string | null;
} {
  const [data, setData] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchPlayers = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/dashboard/players`, {
          signal,
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to load live players");
        }
        const json = (await res.json()) as GameState;
        if (signal?.aborted || !isMounted.current) return;
        setData(json);
      } catch (err) {
        if (signal?.aborted || !isMounted.current) return;
        setError(err instanceof Error ? err.message : "Failed to load live players");
      } finally {
        if (signal?.aborted || !isMounted.current) return;
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let activeController: AbortController | null = null;

    const run = async () => {
      activeController?.abort();
      activeController = new AbortController();
      await fetchPlayers(activeController.signal);
    };

    void run();
    const interval = setInterval(run, pollIntervalMs);

    return () => {
      activeController?.abort();
      clearInterval(interval);
    };
  }, [fetchPlayers, pollIntervalMs]);

  return { data, loading, error };
}
