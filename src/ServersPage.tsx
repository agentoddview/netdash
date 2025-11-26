import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { globalStyles, shortenServerId, getJoinUrl } from "./dashboard";
import type { Server, Player, GameState } from "./dashboard";

type RoleRowProps = {
  label: string;
  count: number;
  color: string;
};

const API_BASE = import.meta.env.VITE_API_URL;

const RoleRow: React.FC<RoleRowProps> = ({ label, count, color }) => {
  if (count === 0) return null;
  return (
    <div className="role-row" style={{ background: color }}>
      <span className="role-row-label">{label}</span>
      <span className="role-row-count">{count}</span>
    </div>
  );
};

const ServersPage: React.FC = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/dashboard/players`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load servers");
        const data = (await res.json()) as GameState;
        setServers(data.servers || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load servers");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredServers = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return servers;
    return servers.filter(
      (s) =>
        s.serverId.toLowerCase().includes(term) ||
        shortenServerId(s.serverId).toLowerCase().includes(term)
    );
  }, [servers, search]);

  const roleCounts = (players: Player[]) => {
    const busOperatorsCount = players.filter((p) => p.team === "Bus Operator").length;
    const transitPoliceCount = players.filter((p) => p.team === "Transit Police").length;
    const passengersCount = players.filter((p) => p.team === "Passenger").length;
    const choosingCount = players.filter((p) => p.team === "Choosing").length;
    return { busOperatorsCount, transitPoliceCount, passengersCount, choosingCount };
  };

  return (
    <div className="dashboard">
      <style>{globalStyles}</style>
      <header className="header">
        <div>
          <p className="eyebrow">Network Dashboard</p>
          <h1>Our Servers</h1>
          <div className="top-nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>
              Main
            </NavLink>
            <NavLink to="/servers" className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}>
              Servers
            </NavLink>
          </div>
        </div>
      </header>

      <div className="servers-search">
        <input
          type="text"
          placeholder="Enter a server name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button aria-label="Search">??</button>
      </div>

      {loading && <p className="muted">Loading servers...</p>}
      {error && <p className="muted">Error: {error}</p>}

      {!loading && !error && filteredServers.length === 0 && (
        <p className="muted">No servers found.</p>
      )}

      {!loading && !error && filteredServers.length > 0 && (
        <div className="servers-grid">
          {filteredServers.map((server) => {
            const totalPlayers = server.players?.length || 0;
            const { busOperatorsCount, transitPoliceCount, passengersCount, choosingCount } =
              roleCounts(server.players || []);
            const hasRoles =
              busOperatorsCount + transitPoliceCount + passengersCount + choosingCount > 0;
            return (
              <div
                key={server.serverId}
                className="server-card-grid"
                onClick={() => navigate(`/servers/${server.serverId}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/servers/${server.serverId}`);
                  }
                }}
              >
                <div className="server-card-grid-header">
                  <div>
                    <p className="muted small">Server</p>
                    <h3>{shortenServerId(server.serverId)}</h3>
                  </div>
                  <div className="server-card-grid-actions">
                    <div className="pill">{totalPlayers} players</div>
                    {getJoinUrl(server) ? (
                      <a
                        className="join-button"
                        href={getJoinUrl(server) ?? "#"}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Join
                      </a>
                    ) : null}
                  </div>
                </div>
                {hasRoles ? (
                  <div className="role-rows">
                    <RoleRow label="Bus Operators" count={busOperatorsCount} color="#facc15" />
                    <RoleRow label="Transit Police" count={transitPoliceCount} color="#00A8FF" />
                    <RoleRow label="Passengers" count={passengersCount} color="#ffffff" />
                    <RoleRow label="Choosing" count={choosingCount} color="#9ca3af" />
                  </div>
                ) : (
                  <p className="muted">
                    None of the players on this server have joined a role yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServersPage;












