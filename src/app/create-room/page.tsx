"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  createGuest,
  createRoom,
  listGameTypes,
  listGameVariants,
  type CreateRoomBody,
  type GameType,
  type GameVariant,
  type Room,
} from "@/lib/api";
import { Button, FixedBottomBar, FormField, Header } from "@/components/ui";

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M15 5L5 15M5 5l10 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ConfirmIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle
        cx="10"
        cy="10"
        r="8"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--accent-blue)] text-xs font-bold text-[var(--accent-blue)]">
      ?
    </span>
  );
}

export default function CreateRoomPage() {
  const router = useRouter();
  const [view, setView] = useState<"form" | "success">("form");
  const [room, setRoom] = useState<Room | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [roomName, setRoomName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gameId, setGameId] = useState("");
  const [variantId, setVariantId] = useState("");

  const [games, setGames] = useState<GameType[]>([]);
  const [variants, setVariants] = useState<GameVariant[]>([]);

  useEffect(() => {
    listGameTypes()
      .then((res) => setGames(res.games))
      .catch(() => setGames([]));
  }, []);

  useEffect(() => {
    if (!gameId) {
      setVariants([]);
      setVariantId("");
      return;
    }
    listGameVariants({ game_id: gameId })
      .then((res) => setVariants(res.variants))
      .catch(() => setVariants([]));
    setVariantId("");
  }, [gameId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);
      try {
        await createGuest(undefined, nickname || undefined);
        const body: CreateRoomBody = {
          name: roomName || undefined,
          game_id: gameId || undefined,
          variant_id: variantId || undefined,
        };
        const created = await createRoom(body);
        setRoom(created);
        setView("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "建立房間失敗");
      } finally {
        setSubmitting(false);
      }
    },
    [nickname, roomName, gameId, variantId]
  );

  const selectedGame = games.find((g) => g.id === gameId);
  const selectedVariant = variants.find((v) => v.id === variantId);

  if (view === "success" && room) {
    return (
      <main className="min-h-screen bg-[var(--background-primary)] pb-24">
        <Header title="Cluiche bord" pageTitle="建立成功" />
        <div className="flex flex-col gap-4 px-4 py-6">
          <div className="space-y-3 rounded-lg bg-[var(--background-muted)] p-4">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">房間名稱</span>
              <span className="text-[var(--text-on-dark)]">{room.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">玩家暱稱</span>
              <span className="text-[var(--text-on-dark)]">
                {(nickname || room.players?.[0]?.nickname) ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">選擇遊戲</span>
              <span className="text-[var(--text-on-dark)]">
                {selectedGame?.name ?? room.game_id ?? "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">規則變體</span>
              <span className="text-[var(--text-on-dark)]">
                {selectedVariant?.name ?? room.variant_id ?? "-"}
              </span>
            </div>
          </div>
          <div className="border-t border-dashed border-[var(--text-secondary)] pt-4">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">房間代碼</span>
              <span className="font-mono text-lg font-medium text-[var(--text-on-dark)]">
                {room.id}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              請將此代碼或連結分享給其他玩家加入
            </p>
          </div>
        </div>
        <FixedBottomBar>
          <Button
            variant="success"
            fullWidth
            leftIcon={<ConfirmIcon />}
            onClick={() => router.push(`/game/${room.id}`)}
          >
            進入房間
          </Button>
        </FixedBottomBar>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background-primary)] pb-24">
      <Header title="Cluiche bord" pageTitle="建立房間" />
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 px-4 py-6"
      >
        <FormField
          label="房間名稱"
          placeholder="請輸入房間名稱"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <FormField
          label="玩家暱稱"
          placeholder="請輸入暱稱"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              選擇遊戲
            </label>
            <button
              type="button"
              className="text-[var(--accent-blue)] outline-none hover:opacity-80"
              aria-label="更多說明"
            >
              <InfoIcon />
            </button>
          </div>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-[var(--background-surface)] px-3 py-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
          >
            <option value="">請選擇遊戲</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              規則變體
            </label>
            <button
              type="button"
              className="text-[var(--accent-blue)] outline-none hover:opacity-80"
              aria-label="更多說明"
            >
              <InfoIcon />
            </button>
          </div>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            disabled={!gameId}
            className="rounded-lg border border-gray-200 bg-[var(--background-surface)] px-3 py-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue)] disabled:opacity-60"
          >
            <option value="">請選擇規則變體</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        {error != null && (
          <p className="text-sm text-[var(--action-danger)]">{error}</p>
        )}
        <FixedBottomBar>
          <Link href="/" className="block w-full">
            <Button
              type="button"
              variant="danger"
              fullWidth
              leftIcon={<CloseIcon />}
            >
              取消建立
            </Button>
          </Link>
          <Button
            type="submit"
            variant="success"
            fullWidth
            leftIcon={<ConfirmIcon />}
            disabled={submitting}
          >
            {submitting ? "建立中..." : "確認建立"}
          </Button>
        </FixedBottomBar>
      </form>
    </main>
  );
}
