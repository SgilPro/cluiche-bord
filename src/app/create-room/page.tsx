"use client";

import { Button, FixedBottomBar, FormField, Header } from "@/components/ui";
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
import { Circle, CircleHelp, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";

export default function CreateRoomPage() {
  const router = useRouter();
  const [view, setView] = useState<"form" | "success">("form");
  const [room, setRoom] = useState<Room | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameUrl, setGameUrl] = useState<string>("");

  const [roomName, setRoomName] = useState("");
  const [nickname, setNickname] = useState("");
  const [gameId, setGameId] = useState("");
  const [variantId, setVariantId] = useState("");

  const [games, setGames] = useState<GameType[]>([]);
  const [variants, setVariants] = useState<GameVariant[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [variantsLoading, setVariantsLoading] = useState(false);

  useEffect(() => {
    setGamesLoading(true);
    listGameTypes()
      .then((res) => setGames(res.games ?? []))
      .catch(() => setGames([]))
      .finally(() => setGamesLoading(false));
  }, []);

  useEffect(() => {
    if (!gameId) {
      setVariants([]);
      setVariantId("");
      setVariantsLoading(false);
      return;
    }
    setVariantsLoading(true);
    setVariantId("");
    listGameVariants({ game_id: gameId })
      .then((res) => setVariants(res.variants ?? []))
      .catch(() => setVariants([]))
      .finally(() => setVariantsLoading(false));
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
    [nickname, roomName, gameId, variantId],
  );

  useEffect(() => {
    if (view !== "success" || !room) return;
    const { hostname, port } = window.location;
    const portSuffix = port ? `:${port}` : "";
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      fetch("/api/local-ip")
        .then((r) => r.json())
        .then((data: { ip: string | null }) => {
          const ip = data.ip ?? hostname;
          setGameUrl(`http://${ip}${portSuffix}/game/${room.id}`);
        })
        .catch(() => setGameUrl(`http://${hostname}${portSuffix}/game/${room.id}`));
    } else {
      setGameUrl(`https://boardgameworld.zeabur.app/game/${room.id}`);
    }
  }, [view, room]);

  const selectedGame = games.find((g) => g.id === gameId);
  const selectedVariant = variants.find((v) => v.id === variantId);

  if (view === "success" && room) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--background-muted)]">
        <Header
          title="Cluiche Bord"
          pageTitle="建立成功"
          pageTitleAlign="center"
          variant="success"
        />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-[360px] px-4 py-6 pb-24">
            {/* Top ticket */}
            <div className="rounded-t-[24px] bg-[var(--background-primary)] px-5 py-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-on-dark)]">房間名稱</span>
                <span className="text-[var(--text-on-dark)] font-medium">{room.name ?? "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-on-dark)]">玩家暱稱</span>
                <span className="text-[var(--text-on-dark)] font-medium">
                  {(nickname || room.players?.[0]?.nickname) ?? "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-on-dark)]">選擇遊戲</span>
                <span className="text-[var(--text-on-dark)] font-medium">
                  {selectedGame?.name ?? room.game_id ?? "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-on-dark)]">規則變體</span>
                <span className="text-[var(--text-on-dark)] font-medium">
                  {selectedVariant?.name ?? room.variant_id ?? "-"}
                </span>
              </div>
            </div>
            {/* Bottom ticket */}
            <div className="border-ticket-top rounded-b-[24px] bg-[var(--background-primary)] px-5 py-5">
              <div className="flex justify-between">
                <span className="text-[var(--text-on-dark)]">房間代碼</span>
                <span className="font-mono text-lg font-medium text-[var(--text-on-dark)]">
                  {room.id}
                </span>
              </div>
              {gameUrl && (
                <div className="mt-4 flex flex-col items-center gap-2">
                  <QRCodeSVG
                    value={gameUrl}
                    size={160}
                    bgColor="#1a1b26"
                    fgColor="#ffffff"
                  />
                  <p className="text-xs text-[var(--text-secondary)] text-center break-all">
                    {gameUrl}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
        <FixedBottomBar
          mode="raw"
          className="h-[43px] items-stretch bg-[var(--background-muted)] px-0 border-ticket-top justify-end"
        >
          <Button
            type="button"
            variant="success"
            className="h-full w-[104px] rounded-none px-2 py-2 text-black"
            leftIcon={<Circle aria-hidden className="h-4 w-4" />}
            onClick={() => router.push(`/game/${room.id}`)}
          >
            進入房間
          </Button>
        </FixedBottomBar>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-muted)]">
      <Header
        title="Cluiche Bord"
        pageTitle="建立房間"
        pageTitleAlign="center"
      />
      <main className="flex-1">
        <div className="flex flex-1 flex-col">
          <form
            id="create-room-form"
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-[360px] flex-col gap-4 px-4 py-6 pb-24"
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
              <div className="flex items-center justify-between gap-2">
                <label className="text-base font-bold text-[var(--text-secondary)]">
                  選擇遊戲
                </label>
                <button
                  type="button"
                  className="text-[var(--accent-blue)] outline-none hover:opacity-80"
                  aria-label="更多說明"
                >
                  <CircleHelp aria-hidden className="h-4 w-4" />
                </button>
              </div>
              <select
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                disabled={gamesLoading}
                className="rounded-lg border border-gray-200 bg-[var(--background-surface)] px-3 py-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue)] disabled:opacity-60"
              >
                <option value="">
                  {gamesLoading ? "載入中..." : "請選擇遊戲"}
                </option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <label className="text-base font-bold text-[var(--text-secondary)]">
                  規則變體
                </label>
                <button
                  type="button"
                  className="text-[var(--accent-blue)] outline-none hover:opacity-80"
                  aria-label="更多說明"
                >
                  <CircleHelp aria-hidden className="h-4 w-4" />
                </button>
              </div>
              <select
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                disabled={!gameId || variantsLoading}
                className="rounded-lg border border-gray-200 bg-[var(--background-surface)] px-3 py-2 text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent-blue)] disabled:opacity-60"
              >
                <option value="">
                  {variantsLoading
                    ? "載入中..."
                    : !gameId
                      ? "請先選擇遊戲"
                      : "請選擇規則變體"}
                </option>
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
          </form>
        </div>
      </main>
      <FixedBottomBar
        mode="raw"
        className="h-[43px] items-stretch bg-[var(--background-muted)] px-0 border-ticket-top justify-between"
      >
        <Link href="/" className="block h-full">
          <Button
            type="button"
            variant="danger"
            className="h-full w-[104px] rounded-none px-2 py-2 text-black"
            leftIcon={<X aria-hidden className="h-4 w-4" />}
          >
            取消建立
          </Button>
        </Link>
        <Button
          type="submit"
          form="create-room-form"
          variant="success"
          className="h-full w-[104px] rounded-none px-2 py-2 text-black"
          leftIcon={<Circle aria-hidden className="h-4 w-4" />}
          disabled={submitting}
        >
          {submitting ? "建立中..." : "確認建立"}
        </Button>
      </FixedBottomBar>
    </div>
  );
}
