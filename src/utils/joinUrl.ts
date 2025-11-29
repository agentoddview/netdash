export function buildJoinUrl(placeId?: number | null, jobId?: string | null): string | null {
  if (!placeId || !jobId) return null;
  return `roblox://experiences/start?placeId=${placeId}&gameInstanceId=${jobId}`;
}
