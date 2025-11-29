export function groupRankLabel(rank: number): string {
  if (rank >= 235) return "Administrator";
  if (rank === 123) return "Lead Supervisor";
  if (rank >= 121 && rank <= 122) return "Supervisor";
  return `Rank ${rank}`;
}

export function nameColorForPlayer(opts: {
  groupRank?: number | string | null;
  role?: string | null;
  hasAccount?: boolean;
}): string | undefined {
  const { groupRank, role } = opts;
  const numeric = typeof groupRank === "number" ? groupRank : Number(groupRank);

  if (Number.isFinite(numeric)) {
    if (numeric >= 235) return "#ef4444";
    if (numeric === 123) return "#22c55e";
    if (numeric >= 121 && numeric <= 122) return "#22c55e";
  }

  const r = (role || "").toLowerCase();
  if (r.includes("transit police")) return "#4da6ff";
  if (r.includes("staff")) return "#a970ff";

  return undefined;
}
