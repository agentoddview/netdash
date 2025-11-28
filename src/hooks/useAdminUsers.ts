import { useCallback, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

export type AdminUserSummary = {
  userId: number;
  createdAt: string;
  updatedAt: string;
  roblox: {
    robloxUserId: number;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  discord: {
    discordUserId: string;
    username?: string | null;
    globalName?: string | null;
    serverDisplayName?: string | null;
    avatarUrl?: string | null;
  } | null;
};

type UseAdminUsersResult = {
  data: AdminUserSummary[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useAdminUsers(): UseAdminUsersResult {
  const [data, setData] = useState<AdminUserSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to load admin users");
      }
      const json = (await res.json()) as AdminUserSummary[];
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin users");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { data, loading, error, refetch: fetchUsers };
}
