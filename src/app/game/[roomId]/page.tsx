"use client";

// import GameChat from "@/components/GameChat"; // 暫時隱藏，未來實作
import type { PlayerView } from "@/lib/games/werewolf/types";
import { getSocket } from "@/lib/socket";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";

interface RoomInfo {
  roomId: string;
  players: Array<{ playerId: string; socketId: string; nickname: string }>;
  maxPlayers: number;
  hostPlayerId?: string | null;
  gameStarted?: boolean; // 遊戲是否已開始
}

export default function GameRoom() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [roomUrl, setRoomUrl] = useState<string>("");
  const [showQRCode, setShowQRCode] = useState(false); // 預設隱藏
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string>("");
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [gameState, setGameState] = useState<PlayerView | null>(null);
  const gameStateRef = useRef<PlayerView | null>(null); // 用 ref 追蹤最新的 gameState
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTransferHostModal, setShowTransferHostModal] = useState(false);
  const [isLoadingGameState, setIsLoadingGameState] = useState(false); // 是否正在載入遊戲狀態
  const [pendingSheriffChoice, setPendingSheriffChoice] = useState<"run" | "skip" | null>(null); // 待確認的選擇（樂觀更新）

  // 同步 gameState 到 gameStateRef
  useEffect(() => {
    gameStateRef.current = gameState;
    // 當收到 server 確認的選擇後，清除待確認狀態
    if (gameState?.private.sheriffChoice && pendingSheriffChoice) {
      setPendingSheriffChoice(null);
    }
  }, [gameState, pendingSheriffChoice]);

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
    if (!playerId || !nickname || !roomId) {
      console.log("Waiting for playerId, nickname, or roomId:", { playerId, nickname, roomId });
      return;
    }

    console.log("Setting up socket connection...", { playerId, nickname, roomId });
    const socket = getSocket();

    const handleRoomJoined = (data: RoomInfo) => {
      console.log("Received room:joined event:", data);
      setRoomInfo(data);
      // 使用 hostPlayerId 判斷是否為房主
      const isHostPlayer = data.hostPlayerId === playerId;
      setIsHost(isHostPlayer);
      console.log("Room joined:", { 
        playerId, 
        players: data.players, 
        isHost: isHostPlayer,
        hostPlayerId: data.hostPlayerId,
        gameStarted: data.gameStarted
      });
      // 如果 server 標記遊戲已開始，但前端還沒有 gameState，設置載入狀態等待 game:state
      if (data.gameStarted && !gameStateRef.current) {
        console.log("Game started but no gameState yet, setting loading state...");
        setIsLoadingGameState(true);
        // 如果 3 秒後還沒收到 game:state，取消載入狀態（可能是 server 問題）
        setTimeout(() => {
          if (!gameStateRef.current) {
            console.warn("Game state not received after 3 seconds");
            setIsLoadingGameState(false);
          }
        }, 3000);
      }
    };

    const handleRoomUpdated = (data: RoomInfo) => {
      console.log("Received room:updated event:", data);
      setRoomInfo(data);
      // 更新房主狀態
      const isHostPlayer = data.hostPlayerId === playerId;
      setIsHost(isHostPlayer);
      console.log("Room updated:", { 
        playerId, 
        players: data.players, 
        isHost: isHostPlayer,
        hostPlayerId: data.hostPlayerId,
        gameStarted: data.gameStarted
      });
      // 如果 server 標記遊戲已開始，但前端還沒有 gameState，設置載入狀態
      if (data.gameStarted && !gameStateRef.current) {
        console.log("Game started but no gameState yet, setting loading state...");
        setIsLoadingGameState(true);
        setTimeout(() => {
          if (!gameStateRef.current) {
            console.warn("Game state not received after 3 seconds");
            setIsLoadingGameState(false);
          }
        }, 3000);
      }
    };

    const handleGameState = (view: PlayerView) => {
      console.log("Received game:state event:", view);
      setGameState(view);
      setIsLoadingGameState(false); // 收到遊戲狀態，取消載入狀態
      setShowQRCode(false); // 遊戲開始後隱藏 QR Code
    };

    const handleError = (data: { message: string }) => {
      console.error("Socket error:", data);
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    };

    const handleUserJoined = (data: { roomId: string; playerId: string; nickname: string }) => {
      console.log("User joined:", data);
      // 房間資訊會透過 room:updated 事件更新，這裡不需要手動更新
      // 保留這個 handler 以防需要即時顯示通知
    };

    const handleConnect = () => {
      console.log("Socket connected, emitting join-room...");
      // 確保連線後再發送 join-room
      // 使用 setTimeout 確保 socket 完全連線後再發送
      setTimeout(() => {
        socket.emit("join-room", { roomId, playerId, nickname });
      }, 100);
    };

    // 監聽連線事件
    socket.on("connect", handleConnect);
    socket.on("room:joined", handleRoomJoined);
    socket.on("room:updated", handleRoomUpdated);
    socket.on("game:state", handleGameState);
    socket.on("error", handleError);
    socket.on("user-joined", handleUserJoined);

    // 如果已經連線，直接發送 join-room
    if (socket.connected) {
      console.log("Socket already connected, emitting join-room immediately...");
      socket.emit("join-room", { roomId, playerId, nickname });
    }

    return () => {
      console.log("Cleaning up socket listeners...");
      socket.off("connect", handleConnect);
      socket.off("room:joined", handleRoomJoined);
      socket.off("room:updated", handleRoomUpdated);
      socket.off("game:state", handleGameState);
      socket.off("error", handleError);
      socket.off("user-joined", handleUserJoined);
    };
  }, [playerId, nickname, roomId]);

  // 設定網址（優先使用環境變數中的內網 IP）
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 優先使用環境變數中的基礎網址（內網 IP）
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      
      // 如果使用 localhost，嘗試從 window.location.hostname 判斷
      let finalUrl = baseUrl;
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
        // 如果還是 localhost，保持原樣（但會顯示提示）
        finalUrl = baseUrl;
      }
      
      const fullUrl = `${finalUrl}/game/${roomId}`;
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

  const handleTransferHost = (newHostPlayerId: string) => {
    const socket = getSocket();
    socket.emit("room:transfer-host", { roomId, newHostPlayerId });
    setShowTransferHostModal(false);
  };

  const handleAction = (actionType: string, payload?: Record<string, unknown>) => {
    // 樂觀更新：如果是參選/不參選操作，立即更新本地狀態
    if (actionType === "sheriff:run" || actionType === "sheriff:skip") {
      const choice = actionType === "sheriff:run" ? "run" : "skip";
      setPendingSheriffChoice(choice);
      
      // 立即更新 gameState 以顯示視覺反饋
      if (gameState) {
        setGameState({
          ...gameState,
          private: {
            ...gameState.private,
            sheriffChoice: choice,
          },
        });
      }
    }
    
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
      "night:wolves_confirm": "狼人確認",
      "night:witch_decide": "女巫行動",
      "night:seer_check": "預言家查驗",
      "night:hunter_check_gesture": "獵人查看手勢",
      "sheriff:collect_candidates": "上警環節",
      "sheriff:withdraw_after_speeches": "退水環節",
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
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">遊戲房間: {roomId}</h1>
            {isHost && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded">
                👑 房主
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isHost && !gameState && roomInfo && (
              <>
                <button
                  onClick={handleStartGame}
                  disabled={roomInfo.players.length !== 10}
                  className={`px-4 py-2 rounded font-semibold transition-colors ${
                    roomInfo.players.length === 10
                      ? "bg-green-500 text-white hover:bg-green-600 shadow-md"
                      : "bg-gray-400 text-gray-200 cursor-not-allowed"
                  }`}
                  title={roomInfo.players.length !== 10 ? `需要 10 位玩家才能開始（目前 ${roomInfo.players.length} 人）` : "點擊開始遊戲"}
                >
                  {roomInfo.players.length === 10 ? (
                    <>🎮 開始遊戲 ({roomInfo.players.length}/10)</>
                  ) : (
                    <>⏳ 等待玩家 ({roomInfo.players.length}/10)</>
                  )}
                </button>
                {roomInfo.players.length > 1 && (
                  <button
                    onClick={() => setShowTransferHostModal(true)}
                    className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                    title="轉移房主權限"
                  >
                    👑 轉移房主
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                showQRCode
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {showQRCode ? "🔽 隱藏 QR Code" : "🔼 顯示 QR Code"}
            </button>
          </div>
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
              
              {/* 如果使用 localhost，顯示提示 */}
              {(roomUrl.includes("localhost") || roomUrl.includes("127.0.0.1")) && (
                <div className="w-full max-w-md mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium mb-1">⚠️ 注意：目前使用 localhost</p>
                  <p className="text-xs text-yellow-700">
                    要讓其他設備掃描 QR Code，請在 <code className="bg-yellow-100 px-1 rounded">.env.local</code> 中設定：
                  </p>
                  <p className="text-xs text-yellow-700 mt-1 font-mono bg-yellow-100 p-2 rounded">
                    NEXT_PUBLIC_BASE_URL=http://YOUR_LOCAL_IP:3000
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    例如：<code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_BASE_URL=http://192.168.0.117:3000</code>
                  </p>
                </div>
              )}
              
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
                {gameState.private.role === "witch" && gameState.private.nightInfo && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="font-semibold text-red-800">夜晚資訊:</p>
                    {gameState.private.nightInfo.killedByWolves && (
                      <p className="text-sm text-red-700">
                        被狼人擊殺: {
                          (() => {
                            const killed = gameState.public.alivePlayers.find((p) => p.playerId === gameState.private.nightInfo!.killedByWolves) ||
                              gameState.public.deadPlayers.find((p) => p.playerId === gameState.private.nightInfo!.killedByWolves);
                            return killed ? `${killed.seatNumber}號 ${killed.nickname}` : "未知";
                          })()
                        }
                      </p>
                    )}
                    {gameState.private.nightInfo.killedByPoison && (
                      <p className="text-sm text-purple-700">
                        被毒殺: {
                          (() => {
                            const killed = gameState.public.alivePlayers.find((p) => p.playerId === gameState.private.nightInfo!.killedByPoison) ||
                              gameState.public.deadPlayers.find((p) => p.playerId === gameState.private.nightInfo!.killedByPoison);
                            return killed ? `${killed.seatNumber}號 ${killed.nickname}` : "未知";
                          })()
                        }
                      </p>
                    )}
                    {gameState.private.nightInfo.savedByWitchTargetId && (
                      <p className="text-sm text-blue-700 font-semibold">
                        銀水（被救）: {
                          (() => {
                            const saved = gameState.public.alivePlayers.find((p) => p.playerId === gameState.private.nightInfo!.savedByWitchTargetId) ||
                              gameState.public.deadPlayers.find((p) => p.playerId === gameState.private.nightInfo!.savedByWitchTargetId);
                            return saved ? `${saved.seatNumber}號 ${saved.nickname}` : "未知";
                          })()
                        }
                      </p>
                    )}
                    {!gameState.private.nightInfo.killedByWolves && !gameState.private.nightInfo.killedByPoison && (
                      <p className="text-sm text-gray-600">今晚無人死亡</p>
                    )}
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

            {/* 準備狀態顯示（僅在 setup:reveal_roles 階段） */}
            {gameState.public.step === "setup:reveal_roles" && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-bold mb-2 text-blue-800">準備狀態</h3>
                <p className="text-sm text-blue-700 mb-2">
                  已準備：{gameState.public.readyPlayers?.length || 0} / {gameState.public.alivePlayers.length} 人
                </p>
                {gameState.public.readyPlayers?.includes(gameState.private.playerId) ? (
                  <p className="text-sm text-green-600 font-semibold">✓ 你已準備</p>
                ) : (
                  <p className="text-sm text-orange-600">請點擊「準備開始」按鈕</p>
                )}
              </div>
            )}

            {/* 可用操作 */}
            {gameState.availableActions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-bold mb-2">你的操作</h3>
                <div className="space-y-2">
                  {gameState.availableActions.map((action, idx) => {
                    if ((action.type.includes("targets") || action.type === "wolf:kill" || action.type === "seer:check") && action.payload?.targets) {
                      // 需要選擇目標的操作（包括狼人擊殺、預言家查驗等）
                      const wolfInfo = gameState.private.wolfInfo;
                      const myPlayerId = gameState.private.playerId;
                      const myVote = wolfInfo?.votes.find((v) => v.wolfId === myPlayerId);
                      const isSeerCheck = action.type === "seer:check";

                      return (
                        <div key={idx} className="border rounded p-2">
                          <p className="font-semibold mb-2">{action.label}</p>
                          <div className="grid grid-cols-3 gap-2">
                            {(action.payload.targets as Array<{ playerId: string; nickname: string; seatNumber: number }>).map(
                              (target) => {
                                const isMyVote = myVote?.targetId === target.playerId;
                                const votesOnTarget = wolfInfo
                                  ? wolfInfo.votes.filter((v) => v.targetId === target.playerId)
                                  : [];

                                return (
                                  <button
                                    key={target.playerId}
                                    onClick={() =>
                                      handleAction(action.type, { targetId: target.playerId, ...action.payload })
                                    }
                                    className={`px-3 py-2 rounded text-sm transition-colors ${
                                      isSeerCheck
                                        ? "bg-purple-500 text-white hover:bg-purple-600"
                                        : isMyVote
                                        ? "bg-red-600 text-white hover:bg-red-700"
                                        : "bg-blue-500 text-white hover:bg-blue-600"
                                    }`}
                                  >
                                    <div className="flex flex-col items-start">
                                      <span>
                                        {target.seatNumber}號 {target.nickname}
                                      </span>
                                      {!isSeerCheck && votesOnTarget.length > 0 && (
                                        <span className="mt-1 text-xs text-red-100">
                                          狼人票數：{votesOnTarget.length}
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              }
                            )}
                          </div>
                          {wolfInfo && !isSeerCheck && (
                            <div className="mt-2 text-xs text-gray-600 space-y-1">
                              {myVote?.targetSeatNumber ? (
                                <p>
                                  你目前選擇：{myVote.targetSeatNumber}號 {myVote.targetNickname}
                                </p>
                              ) : (
                                <p>你尚未選擇擊殺目標</p>
                              )}
                              <div>
                                <p className="font-semibold">各狼人選擇：</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {wolfInfo.votes.map((v) => (
                                    <li key={v.wolfId}>
                                      {v.wolfSeatNumber}號 {v.wolfNickname} →{" "}
                                      {v.targetSeatNumber
                                        ? `${v.targetSeatNumber}號 ${v.targetNickname}`
                                        : "尚未選擇"}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
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
                    } else if (action.type === "wolf:confirm") {
                      // 狼人確認階段：顯示最終目標並要求再次確認
                      const wolfInfo = gameState.private.wolfInfo;
                      const finalTargetId = wolfInfo?.finalTargetId || null;
                      const finalTarget =
                        finalTargetId &&
                        gameState.public.alivePlayers.find((p) => p.playerId === finalTargetId);
                      const myPlayerId = gameState.private.playerId;
                      const myConfirmation = wolfInfo?.confirmations?.find((c) => c.wolfId === myPlayerId);
                      const isConfirmed = myConfirmation?.confirmed === true;

                      return (
                        <div key={idx} className="border rounded p-2 bg-gray-50">
                          <p className="font-semibold mb-2">確認擊殺目標</p>
                          <p className="text-sm mb-2">
                            最終目標：
                            {finalTarget
                              ? `${finalTarget.seatNumber}號 ${finalTarget.nickname}`
                              : "尚未決定"}
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            請所有狼人確認後，才會進入女巫行動階段。
                          </p>
                          {wolfInfo?.confirmations && (
                            <div className="mb-3 text-xs text-gray-600">
                              <p className="font-semibold mb-1">確認狀態：</p>
                              <ul className="list-disc list-inside space-y-0.5">
                                {wolfInfo.confirmations.map((c) => (
                                  <li key={c.wolfId}>
                                    {c.wolfSeatNumber}號 {c.wolfNickname}：{c.confirmed ? "✅ 已確認" : "⏳ 待確認"}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {isConfirmed ? (
                            <div className="px-4 py-2 bg-green-100 text-green-800 rounded text-center">
                              ✅ 你已確認
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAction(action.type)}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              確認擊殺目標
                            </button>
                          )}
                        </div>
                      );
                    } else if (action.type === "hunter:check_gesture") {
                      // 獵人查看手勢
                      return (
                        <div key={idx} className="border rounded p-2">
                          <p className="font-semibold mb-2">{action.label}</p>
                          <button
                            onClick={() => handleAction(action.type, action.payload)}
                            className="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                          >
                            點擊查看手勢
                          </button>
                        </div>
                      );
                    } else if (action.type === "hunter:confirm_gesture") {
                      // 獵人確認手勢結果
                      const gesture = gameState.private.hunterGesture;
                      return (
                        <div key={idx} className="border rounded p-2">
                          <p className="font-semibold mb-2">手勢結果</p>
                          <div className="p-3 bg-gray-50 rounded mb-3">
                            <p className="text-lg font-bold text-center">
                              {gesture === "good" ? (
                                <span className="text-green-600">✅ 可開槍</span>
                              ) : (
                                <span className="text-red-600">❌ 不能開槍</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 text-center mt-2">
                              {gesture === "good"
                                ? "你的手勢顯示可以開槍"
                                : "你的手勢顯示不能開槍（可能被毒）"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleAction(action.type, action.payload)}
                            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            確認
                          </button>
                        </div>
                      );
                    } else if (action.type === "sheriff:run" || action.type === "sheriff:skip") {
                      // 警長參選/不參選 - 使用 radio group 樣式
                      const myChoice = gameState.private.sheriffChoice || pendingSheriffChoice; // 使用樂觀更新的選擇
                      const isRun = action.type === "sheriff:run";
                      const isSelected = (isRun && myChoice === "run") || (!isRun && myChoice === "skip");
                      const isPending = pendingSheriffChoice === (isRun ? "run" : "skip") && !gameState.private.sheriffChoice;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAction(action.type, action.payload)}
                          disabled={isPending} // 等待 server 確認時禁用按鈕
                          className={`w-full px-4 py-3 rounded border-2 transition-colors ${
                            isSelected
                              ? "bg-green-500 text-white border-green-600 font-bold"
                              : isPending
                              ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          } ${isPending ? "opacity-75 cursor-wait" : ""}`}
                        >
                          <div className="flex items-center justify-center">
                            <span className={`mr-2 ${isSelected ? "text-white" : isPending ? "text-yellow-600" : "text-gray-400"}`}>
                              {isPending ? "⏳" : isSelected ? "✓" : "○"}
                            </span>
                            <span>{action.label}</span>
                          </div>
                          {isSelected && !isPending && (
                            <p className="text-xs mt-1 text-green-100">已選擇</p>
                          )}
                          {isPending && (
                            <p className="text-xs mt-1 text-yellow-600">處理中...</p>
                          )}
                        </button>
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
                {gameState.public.step === "sheriff:collect_candidates" && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-700 mb-2">
                      請選擇是否參選警長。所有人都選擇完成後，房主可以確認進入下一階段。
                    </p>
                    {(() => {
                      const alivePlayers = gameState.public.alivePlayers;
                      const totalPlayers = alivePlayers.length;
                      return (
                        <p className="text-xs text-blue-600">
                          總共 {totalPlayers} 位玩家需要選擇
                        </p>
                      );
                    })()}
                  </div>
                )}
                {gameState.public.step !== "sheriff:collect_candidates" && (
                  <p>候選人: {gameState.public.sheriffElection.candidates.length} 人</p>
                )}
                {gameState.public.sheriffElection.currentSpeaker && (
                  <p>目前發言: {gameState.public.alivePlayers.find((p) => p.playerId === gameState.public.sheriffElection!.currentSpeaker)?.nickname}</p>
                )}
              </div>
            )}
          </div>
        ) : isLoadingGameState ? (
          <div className="bg-white rounded-lg shadow-md p-4 flex-1">
            <div className="mb-4">
              <p className="text-lg font-semibold mb-2">載入遊戲狀態中...</p>
              <p className="text-sm text-gray-600">請稍候...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 flex-1">
            <div className="mb-4">
              <p className="text-lg font-semibold mb-2">等待遊戲開始...</p>
              {isHost && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
                  <p className="text-sm text-yellow-800">
                    👑 你是房主，當有 10 位玩家時可以開始遊戲
                  </p>
                  {roomInfo && roomInfo.players.length === 10 && (
                    <button
                      onClick={handleStartGame}
                      className="mt-2 w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold shadow-md"
                    >
                      🎮 開始遊戲
                    </button>
                  )}
                </div>
              )}
              {!isHost && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
                  <p className="text-sm text-blue-800">
                    等待房主開始遊戲...
                  </p>
                </div>
              )}
            </div>
            
            {/* 玩家列表 */}
            <div className="mt-4">
              {roomInfo ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">
                      房間玩家 ({roomInfo.players.length}/{roomInfo.maxPlayers})
                    </h3>
                  </div>
                  
                  {roomInfo.players.length === 0 ? (
                    <div className="p-4 bg-gray-50 rounded text-center">
                      <p className="text-gray-500">目前沒有玩家在房間內</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                        {roomInfo.players.map((player, index) => {
                          const isHostPlayer = roomInfo.hostPlayerId === player.playerId;
                          const isCurrentPlayer = player.playerId === playerId;
                          return (
                            <div 
                              key={player.playerId} 
                              className={`p-3 rounded-lg border-2 transition-all ${
                                isCurrentPlayer
                                  ? "bg-blue-50 border-blue-500 shadow-lg ring-2 ring-blue-300"
                                  : isHostPlayer 
                                  ? "bg-yellow-50 border-yellow-400 shadow-md" 
                                  : "bg-white border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {isHostPlayer && (
                                  <span className="text-lg">👑</span>
                                )}
                                {isCurrentPlayer && (
                                  <span className="text-lg">📍</span>
                                )}
                                <p className={`text-sm font-semibold ${
                                  isCurrentPlayer ? "text-blue-800" : "text-gray-800"
                                }`}>
                                  {player.nickname}
                                  {isCurrentPlayer && (
                                    <span className="ml-1 text-xs text-blue-600">(你)</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className={`text-xs ${
                                  isCurrentPlayer ? "text-blue-600 font-semibold" : "text-gray-500"
                                }`}>
                                  {index + 1}號
                                </p>
                                <div className="flex items-center gap-1">
                                  {isCurrentPlayer && (
                                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                                      你
                                    </span>
                                  )}
                                  {isHostPlayer && (
                                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                                      房主
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {roomInfo.players.length < 10 && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm text-blue-800 text-center">
                            ⏳ 還需要 <strong>{10 - roomInfo.players.length}</strong> 位玩家才能開始遊戲
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="p-4 bg-gray-100 rounded text-center">
                  <p className="text-gray-600">載入房間資訊中...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 轉移房主 Modal */}
      {showTransferHostModal && roomInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">轉移房主權限</h2>
            <p className="text-sm text-gray-600 mb-4">
              選擇要將房主權限轉移給哪位玩家：
            </p>
            <div className="space-y-2 mb-4">
              {roomInfo.players
                .filter((player) => player.playerId !== playerId)
                .map((player) => (
                  <button
                    key={player.playerId}
                    onClick={() => handleTransferHost(player.playerId)}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{player.nickname}</span>
                      <span className="text-xs text-gray-500">
                        {roomInfo.players.findIndex((p) => p.playerId === player.playerId) + 1}號
                      </span>
                    </div>
                  </button>
                ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowTransferHostModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 聊天區域 - 暫時隱藏，未來實作 */}
      {/* <div className="w-80 border-l border-gray-200">
        <GameChat roomId={roomId} />
      </div> */}
    </div>
  );
}
