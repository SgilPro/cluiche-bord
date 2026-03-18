"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { LogOut, Play, Share } from "lucide-react";
import {
  getRoom,
  getUserId,
  leaveRoom,
} from "@/lib/api";
import type { Room } from "@/lib/api";
import {
  Button,
  Header,
  NotificationBanner,
  PlayerListItem,
} from "@/components/ui";

export default function WaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [starting, setStarting] = useState(false);

  const currentUserId = typeof window !== "undefined" ? getUserId() : null;
  const isHost =
    room != null &&
    currentUserId != null &&
    room.host_user_id === currentUserId;

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await getRoom(roomId);
      setRoom(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入房間失敗");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const handleShare = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      navigator.share({
        title: "狼人殺房間",
        url,
        text: `加入房間 ${room?.name ?? roomId}`,
      }).catch(() => {
        navigator.clipboard?.writeText(url);
      });
    } else {
      navigator.clipboard?.writeText(url);
    }
  }, [room?.name, roomId]);

  const handleLeave = useCallback(async () => {
    setLeaving(true);
    try {
      await leaveRoom(roomId);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "離開房間失敗");
    } finally {
      setLeaving(false);
    }
  }, [roomId, router]);

  const handleStartGame = useCallback(() => {
    if (!isHost || !room) return;
    setStarting(true);
    router.push(`/game/${room.id}`);
  }, [isHost, room, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-[var(--text-secondary)]">載入中...</p>
      </main>
    );
  }

  if (error != null && room == null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-[var(--action-danger)]">{error}</p>
        <Link
          href="/"
          className="rounded-lg bg-[var(--accent-secondary)] px-4 py-2.5 text-base font-medium text-[var(--text-on-dark)]"
        >
          返回首頁
        </Link>
      </main>
    );
  }

  if (room == null) return null;

  const currentCount = room.players?.length ?? 0;
  const maxCount = room.max_players ?? 10;

  const slots: Array<{
    seatNumber: number;
    player: { user_id: string; nickname: string } | null;
  }> = [];
  for (let i = 1; i <= maxCount; i++) {
    const player =
      room.players != null && i <= room.players.length
        ? room.players[i - 1] ?? null
        : null;
    slots.push({ seatNumber: i, player });
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-surface)]">
      <Header
        title="Werewolf"
        variant="werewolf"
        actionIcon={<Share size={24} aria-hidden />}
        onActionClick={handleShare}
      />

      <main className="flex-1 pb-[42px] pt-2">
        <div className="flex flex-col gap-4 px-4 py-4">
          {!bannerDismissed && (
            <NotificationBanner
              secondaryMessage="正在等待玩家加入房間..."
              message={`目前人數 ${currentCount}/${maxCount} 人, 人數到齊後由房主按下開始遊戲`}
              dismissible
              onDismiss={() => setBannerDismissed(true)}
            />
          )}

          {isHost && (
            <div className="flex justify-end gap-2">
              <Button
                variant="purple"
                className="h-[42px] w-[104px] rounded-none"
                onClick={() => {/* reorder */}}
              >
                重新排序
              </Button>
              <Button
                variant="yellow"
                className="h-[42px] w-[104px] rounded-none"
                onClick={() => {/* change host */}}
              >
                變更房主
              </Button>
            </div>
          )}

          <ul className="flex flex-col gap-2" role="list">
            {slots.map(({ seatNumber, player }) => (
              <li key={seatNumber}>
                <PlayerListItem
                  seatNumber={seatNumber}
                  name={player?.nickname ?? null}
                  isHost={player?.user_id === room.host_user_id}
                  isEmpty={player == null}
                />
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[var(--background-surface)]">
        <div className="flex h-[42px] items-stretch justify-between">
          <Button
            variant="danger"
            className="h-full w-[104px] rounded-none text-black"
            leftIcon={<LogOut size={20} aria-hidden />}
            onClick={handleLeave}
            disabled={leaving}
          >
            離開房間
          </Button>
          {isHost && (
            <Button
              variant="green"
              className={`h-full w-[104px] rounded-none text-black${currentCount < maxCount ? " opacity-60" : ""}`}
              leftIcon={<Play size={20} aria-hidden />}
              onClick={handleStartGame}
              disabled={starting}
            >
              開始遊戲
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
