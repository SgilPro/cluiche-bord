"use client";

import GameChat from "@/components/GameChat";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { PlayerView } from "@/lib/games/werewolf/types";

interface RoomInfo {
  roomId: string;
  players: Array<{ playerId: string; socketId: string; nickname: string }>;
  maxPlayers: number;
}

export default function GameRoom() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [roomUrl, setRoomUrl] = useState<string>("");
  const [showQRCode, setShowQRCode] = useState(true);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [gameState, setGameState] = useState<PlayerView | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 生成或取得 playerId
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPlayerId = localStorage.getItem(`playerId_${roomId}`);
      const storedNickname = localStorage.getItem(`nickname_${roomId}`);
      
      if (storedPlayerId && storedNickname) {
        setPlayerId(storedPlayerId);
        setNickname(storedNickname);
        setShowNicknameModal(false);
      } else {
        // 生成新的 playerId
        const newPlayerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        setPlayerId(newPlayerId);
        setShowNicknameModal(true);
      }
    }
  }, [roomId]);

  // Socket.IO 連線
  useEffect(() => {
    if (!playerId || !nickname || !roomId) return;

    const socket = getSocket();

    const handleRoomJoined = (data: RoomInfo) => {
      setRoomInfo(data);
      // 檢查是否為房主（第一個加入的玩家）
      setIsHost(data.players.length === 1 || data.players[0]?.playerId === playerId);
    };

    const handleGameState = (view: PlayerView) => {
      setGameState(view);
      setShowQRCode(false); // 遊戲開始後隱藏 QR Code
    };

    const handleError = (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    };

    const handleUserJoined = (data: { roomId: string; playerId: string; nickname: string }) => {
      // 更新房間資訊
      if (roomInfo) {
        setRoomInfo({
          ...roomInfo,
          players: [
            ...roomInfo.players,
            { playerId: data.playerId, socketId: "", nickname: data.nickname },
          ],
        });
      }
    };

    socket.on("room:joined", handleRoomJoined);
    socket.on("game:state", handleGameState);
    socket.on("error", handleError);
    socket.on("user-joined", handleUserJoined);

    // 加入房間
    socket.emit("join-room", { roomId, playerId, nickname });

    return () => {
      socket.off("room:joined", handleRoomJoined);
      socket.off("game:state", handleGameState);
      socket.off("error", handleError);
      socket.off("user-joined", handleUserJoined);
    };
  }, [playerId, nickname, roomId]);

  // 設定網址
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentUrl = window.location.origin;
      const fullUrl = `${currentUrl}/game/${roomId}`;
      setRoomUrl(fullUrl);
    }
  }, [roomId]);

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim() && playerId) {
      localStorage.setItem(`playerId_${roomId}`, playerId);
      localStorage.setItem(`nickname_${roomId}`, nickname.trim());
      setShowNicknameModal(false);
    }
  };

  const handleStartGame = () => {
    const socket = getSocket();
    socket.emit("game:start", { roomId });
  };

  const handleAction = (actionType: string, payload?: Record<string, unknown>) => {
    const socket = getSocket();
    socket.emit("game:action", {
      roomId,
      action: {
        type: actionType,
        payload,
      },
    });
  };

  const getRoleName = (role: string | null): string => {
    const roleMap: Record<string, string> = {
      werewolf: "狼人",
      seer: "預言家",
      witch: "女巫",
      hunter: "獵人",
      villager: "村民",
    };
    return role ? roleMap[role] || role : "未知";
  };

  const getPhaseName = (phase: string): string => {
    const phaseMap: Record<string, string> = {
      setup: "準備階段",
      night_first: "首夜",
      night_regular: "夜晚",
      sheriff_election: "警長競選",
      day: "白天",
      finished: "遊戲結束",
    };
    return phaseMap[phase] || phase;
  };

  const getStepName = (step: string | null): string => {
    if (!step) return "";
    const stepMap: Record<string, string> = {
      "setup:assign_roles": "分配角色",
      "setup:reveal_roles": "查看角色",
      "night:wolves_attack": "狼人行動",
      "night:witch_decide": "女巫行動",
      "night:seer_check": "預言家查驗",
      "night:hunter_check_gesture": "獵人查看手勢",
      "sheriff:collect_candidates": "收集候選人",
      "sheriff:speeches": "候選人發言",
      "sheriff:voting": "投票選警長",
      "day:apply_night_deaths": "套用夜晚結果",
      "day:announce_deaths": "公布死訊",
      "day:hunter_night_shot": "獵人夜槍",
      "day:speeches": "白天發言",
      "day:voting": "投票處決",
      "day:hunter_day_shot": "獵人白天槍",
    };
    return stepMap[step] || step;
  };

  if (showNicknameModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96">
          <h2 className="text-xl font-bold mb-4">輸入暱稱</h2>
          <form onSubmit={handleNicknameSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">暱稱</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="輸入你的暱稱"
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                確定
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* 遊戲主區域 */}
      <div className="flex-1 p-4 flex flex-col overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">遊戲房間: {roomId}</h1>
          {isHost && !gameState && (
            <button
              onClick={handleStartGame}
              disabled={!roomInfo || roomInfo.players.length !== 10}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              開始遊戲 ({roomInfo?.players.length || 0}/10)
            </button>
          )}
          <button
            onClick={() => setShowQRCode(!showQRCode)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            {showQRCode ? "隱藏 QR Code" : "顯示 QR Code"}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* QR Code 顯示區域 */}
        {showQRCode && roomUrl && !gameState && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 mb-4 border-2 border-blue-200">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold text-gray-800">掃描 QR Code 加入房間</h2>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-inner mb-4 border-4 border-white">
                <QRCodeSVG value={roomUrl} size={280} level="H" includeMargin={true} />
              </div>
              <div className="text-center w-full max-w-md">
                <p className="text-sm font-medium text-gray-700 mb-2">房間網址：</p>
                <div className="bg-white p-3 rounded-lg border border-gray-300 mb-3">
                  <p className="text-xs font-mono text-gray-800 break-all">{roomUrl}</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(roomUrl);
                      alert("✅ 網址已複製到剪貼簿！");
                    } catch (err) {
                      console.error("複製失敗:", err);
                    }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md"
                >
                  📋 複製網址
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 遊戲狀態顯示 */}
        {gameState ? (
          <div className="bg-white rounded-lg shadow-md p-4 flex-1 overflow-auto">
            {/* 遊戲資訊 */}
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">
                {getPhaseName(gameState.public.phase)} - {getStepName(gameState.public.step)}
              </h2>
              {gameState.public.winner && (
                <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded mb-2">
                  <strong>遊戲結束！</strong> {gameState.public.winner === "werewolves" ? "狼人" : "好人"}勝利！
                </div>
              )}
            </div>

            {/* 玩家資訊 */}
            <div className="mb-4">
              <h3 className="font-bold mb-2">你的資訊</h3>
              <div className="bg-gray-50 p-3 rounded">
                <p>暱稱: {gameState.private.nickname}</p>
                <p>座位: {gameState.private.seatNumber}</p>
                <p>角色: {getRoleName(gameState.private.role)}</p>
                <p>狀態: {gameState.private.alive ? "存活" : "死亡"}</p>
                {gameState.private.isSheriff && <p className="text-yellow-600">⭐ 你是警長</p>}
                {gameState.private.role === "hunter" && gameState.private.hunterGesture && (
                  <p>手勢: {gameState.private.hunterGesture === "good" ? "✅ 可開槍" : "❌ 不能開槍"}</p>
                )}
                {gameState.private.role === "seer" && gameState.private.seerChecks.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">查驗記錄:</p>
                    {gameState.private.seerChecks.map((check, idx) => {
                      const target = gameState.public.alivePlayers.find((p) => p.playerId === check.targetId) ||
                        gameState.public.deadPlayers.find((p) => p.playerId === check.targetId);
                      return (
                        <p key={idx} className="text-sm">
                          {target?.nickname || check.targetId}: {check.result === "werewolf" ? "狼人" : "好人"}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 公開資訊 */}
            <div className="mb-4">
              <h3 className="font-bold mb-2">存活玩家 ({gameState.public.alivePlayers.length})</h3>
              <div className="grid grid-cols-5 gap-2">
                {gameState.public.alivePlayers.map((player) => (
                  <div
                    key={player.playerId}
                    className={`p-2 rounded border ${
                      player.isSheriff ? "bg-yellow-100 border-yellow-400" : "bg-gray-50"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      {player.seatNumber}號 {player.isSheriff && "⭐"}
                    </p>
                    <p className="text-xs">{player.nickname}</p>
                  </div>
                ))}
              </div>
            </div>

            {gameState.public.deadPlayers.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold mb-2">死亡玩家</h3>
                <div className="grid grid-cols-5 gap-2">
                  {gameState.public.deadPlayers.map((player) => (
                    <div key={player.playerId} className="p-2 rounded border bg-gray-200 opacity-60">
                      <p className="text-sm">
                        {player.seatNumber}號 {player.isSheriff && "⭐"}
                      </p>
                      <p className="text-xs">{player.nickname}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 夜晚死亡資訊 */}
            {gameState.public.nightDeaths.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <h3 className="font-bold mb-2">昨晚死亡:</h3>
                {gameState.public.nightDeaths.map((death, idx) => (
                  <p key={idx}>
                    {death.nickname} ({death.cause === "wolf" ? "被狼刀" : death.cause === "poison" ? "被毒" : death.cause})
                  </p>
                ))}
              </div>
            )}

            {/* 可用操作 */}
            {gameState.availableActions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold mb-2">你的操作</h3>
                <div className="space-y-2">
                  {gameState.availableActions.map((action, idx) => {
                    if (action.type.includes("targets") && action.payload?.targets) {
                      // 需要選擇目標的操作
                      return (
                        <div key={idx} className="border rounded p-2">
                          <p className="font-semibold mb-2">{action.label}</p>
                          <div className="grid grid-cols-3 gap-2">
                            {(action.payload.targets as Array<{ playerId: string; nickname: string; seatNumber: number }>).map(
                              (target) => (
                                <button
                                  key={target.playerId}
                                  onClick={() => handleAction(action.type, { targetId: target.playerId, ...action.payload })}
                                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                >
                                  {target.seatNumber}號 {target.nickname}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    } else if (action.type === "sheriff:vote" && action.payload?.candidates) {
                      // 警長投票
                      return (
                        <div key={idx} className="border rounded p-2">
                          <p className="font-semibold mb-2">{action.label}</p>
                          <div className="grid grid-cols-3 gap-2">
                            {(action.payload.candidates as Array<{ playerId: string; nickname: string; seatNumber: number }>).map(
                              (candidate) => {
                                const candidatePlayer = gameState.public.alivePlayers.find((p) => p.playerId === candidate.playerId);
                                return (
                                  <button
                                    key={candidate.playerId}
                                    onClick={() => handleAction(action.type, { candidateId: candidate.playerId })}
                                    className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                  >
                                    {candidatePlayer?.seatNumber}號 {candidate.nickname}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      // 簡單操作
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAction(action.type, action.payload)}
                          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {action.label}
                        </button>
                      );
                    }
                  })}
                </div>
              </div>
            )}

            {/* 等待中 */}
            {gameState.availableActions.length === 0 && gameState.public.phase !== "finished" && (
              <div className="p-4 bg-gray-100 rounded text-center">
                <p>等待其他玩家行動...</p>
              </div>
            )}

            {/* 警長競選狀態 */}
            {gameState.public.sheriffElection && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-bold mb-2">警長競選</h3>
                <p>候選人: {gameState.public.sheriffElection.candidates.length} 人</p>
                {gameState.public.sheriffElection.currentSpeaker && (
                  <p>目前發言: {gameState.public.alivePlayers.find((p) => p.playerId === gameState.public.sheriffElection!.currentSpeaker)?.nickname}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 flex-1">
            <p>等待遊戲開始...</p>
            {roomInfo && (
              <div className="mt-4">
                <p>房間玩家 ({roomInfo.players.length}/{roomInfo.maxPlayers}):</p>
                <ul className="list-disc list-inside">
                  {roomInfo.players.map((player) => (
                    <li key={player.playerId}>{player.nickname}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 聊天區域 */}
      <div className="w-80 border-l border-gray-200">
        <GameChat roomId={roomId} />
      </div>
    </div>
  );
}
