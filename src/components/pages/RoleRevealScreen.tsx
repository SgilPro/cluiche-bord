"use client";

import { Skull, Eye, FlaskConical, Crosshair, User } from "lucide-react";
import type { RoleId } from "@/lib/games/werewolf/types";

interface RoleInfo {
  icon: React.ReactNode;
  name: string;
  description: string;
}

const ROLE_INFO: Record<RoleId, RoleInfo> = {
  wolf: {
    icon: <Skull size={64} className="text-red-400" />,
    name: "狼人",
    description: "夜晚與同伴合作，選擇淘汰一名村民。",
  },
  seer: {
    icon: <Eye size={64} className="text-purple-400" />,
    name: "預言家",
    description: "每晚可查驗一名玩家的陣營。",
  },
  witch: {
    icon: <FlaskConical size={64} className="text-green-400" />,
    name: "女巫",
    description: "擁有一瓶解藥和一瓶毒藥，各可使用一次。",
  },
  hunter: {
    icon: <Crosshair size={64} className="text-yellow-400" />,
    name: "獵人",
    description: "被淘汰時可以帶走一名玩家。",
  },
  villager: {
    icon: <User size={64} className="text-blue-300" />,
    name: "村民",
    description: "透過邏輯推理，白天投票淘汰狼人。",
  },
};

interface RoleRevealScreenProps {
  role: RoleId;
  onConfirm?: () => void;
}

export default function RoleRevealScreen({ role, onConfirm }: RoleRevealScreenProps) {
  const info = ROLE_INFO[role];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background-primary)]">
      <div className="mx-auto flex max-w-[430px] flex-col items-center gap-6 px-6 text-center">
        <p className="text-sm uppercase tracking-widest text-[var(--text-secondary)]">
          你的角色是
        </p>

        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10">
          {info.icon}
        </div>

        <h1 className="text-4xl font-bold text-[var(--text-on-dark)]">{info.name}</h1>
        <p className="text-[var(--text-secondary)]">{info.description}</p>

        {onConfirm && (
          <button
            type="button"
            onClick={onConfirm}
            className="mt-4 rounded-xl bg-white/20 px-8 py-3 text-sm font-medium text-[var(--text-on-dark)] hover:bg-white/30 active:bg-white/10"
          >
            確認
          </button>
        )}
      </div>
    </div>
  );
}
