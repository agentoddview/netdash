import { useCallback, useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

interface RawAdminUser {
  userId: number;
  createdAt: string;
  updatedAt: string;
  lastLoginIp?: string | null;
  lastLoginAt?: string | null;
  roblox?: {
    robloxUserId: number;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  discord?: {
    discordUserId: string;
    username: string;
    globalName?: string | null;
    serverDisplayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export interface AdminUser {
  id: number;
  createdAt: string;
  updatedAt: string;
  lastLoginIp?: string | null;
  lastLoginAt?: string | null;
  roblox?: {
    username: string;
    displayName: string;
    userId: number;
    avatarUrl?: string | null;
  } | null;
  discord?: {
    username: string;
    globalName?: string | null;
    id: string;
    avatarUrl?: string | null;
    serverDisplayName?: string | null;
  } | null;
}

type UseAdminUsersResult = {
  data: AdminUser[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useAdminUsers(): UseAdminUsersResult {
  const [data, setData] = useState<AdminUser[] | null>(null);
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
      const json = (await res.json()) as RawAdminUser[];
      const mapped: AdminUser[] = json.map((u) => ({
        id: u.userId,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        lastLoginIp: u.lastLoginIp ?? null,
        lastLoginAt: u.lastLoginAt ?? null,
        roblox: u.roblox
          ? {
              userId: u.roblox.robloxUserId,
              username: u.roblox.username,
              displayName: u.roblox.displayName,
              avatarUrl: u.roblox.avatarUrl ?? null,
            }
          : null,
        discord: u.discord
          ? {
              id: u.discord.discordUserId,
              username: u.discord.username,
              globalName: u.discord.globalName ?? null,
              serverDisplayName: u.discord.serverDisplayName ?? null,
              avatarUrl: u.discord.avatarUrl ?? null,
            }
          : null,
      }));
      setData(mapped);
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
