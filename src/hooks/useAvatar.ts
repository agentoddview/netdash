import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL;
const headshotApiUrl = (userId: number) => `${API_BASE}/proxy/avatar/${userId}`;

export function useAvatar(userId?: number | null): { avatarUrl: string | null; loading: boolean } {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(userId ? headshotApiUrl(userId) : null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(headshotApiUrl(userId), {
          signal: controller.signal,
          cache: "no-store",
          credentials: "include",
          headers: { accept: "application/json" },
        });
        if (!res.ok) {
          throw new Error("Failed to load avatar");
        }
        const json = (await res.json()) as { imageUrl?: string };
        if (cancelled || controller.signal.aborted) return;
        setAvatarUrl(json.imageUrl || headshotApiUrl(userId));
      } catch {
        if (cancelled || controller.signal.aborted) return;
        setAvatarUrl(headshotApiUrl(userId));
      } finally {
        if (cancelled || controller.signal.aborted) return;
        setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [userId]);

  return { avatarUrl, loading };
}
