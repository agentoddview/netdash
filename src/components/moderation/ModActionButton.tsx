import React, { useState } from "react";
import { useAuth } from "../../AuthGate";
import type { Player } from "../../dashboard";
import { ModActionModal } from "./ModActionModal";

export type ModActionPlayer = Pick<
  Player,
  "userId" | "username" | "displayName" | "role" | "rank" | "miles" | "cash"
>;

type ModActionButtonProps = {
  player: ModActionPlayer;
  serverId: string;
};

export const ModActionButton: React.FC<ModActionButtonProps> = ({ player, serverId }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const canModerate = !!user?.permissions?.canModerate;

  if (!canModerate) return null;

  return (
    <>
      <button
        className="mod-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="Moderator tools"
        type="button"
      >
        🛠
      </button>
      {open && (
        <ModActionModal isOpen={open} onClose={() => setOpen(false)} player={player} serverId={serverId} />
      )}
    </>
  );
};

export default ModActionButton;
