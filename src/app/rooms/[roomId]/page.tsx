"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getRoom,
  getUserId,
  leaveRoom,
} from "@/lib/api";
import type { Room } from "@/lib/api";
import {
  Button,
  FixedBottomBar,
  Header,
  NotificationBanner,
  PlayerListItem,
  SegmentedControl,
} from "@/components/ui";

function ShareIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function LeaveIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <polygon points="5 3 5 17 17 10 5 3" />
    </svg>
  );
}

export default function WaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [segmentActive, setSegmentActive] = useState<string>("reorder");
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

  const segments = [
    { id: "reorder", label: "重新排序" },
    { id: "change-host", label: "變更房主" },
  ];

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
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)]">
      <Header
        title="Werewolf"
        variant="werewolf"
        actionIcon={<ShareIcon />}
        onActionClick={handleShare}
      />

      <main className="flex-1 pb-24">
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
            <div className="flex max-w-[320px]">
              <SegmentedControl
                segments={segments}
                activeId={segmentActive}
                onSelect={setSegmentActive}
              />
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

      <FixedBottomBar className="bg-[var(--background-surface)]">
        <Button
          variant="danger"
          fullWidth
          leftIcon={<LeaveIcon />}
          onClick={handleLeave}
          disabled={leaving}
        >
          離開房間
        </Button>
        {isHost ? (
          <Button
            variant="success"
            fullWidth
            leftIcon={<PlayIcon />}
            onClick={handleStartGame}
            disabled={starting}
          >
            開始遊戲
          </Button>
        ) : (
          <div />
        )}
      </FixedBottomBar>
    </div>
  );
}
