/**
 * 狼人殺遊戲引擎核心邏輯
 */

import type {
    GameAction,
    GameState,
    PlayerState,
    PlayerView,
    RoleId,
    WerewolfOptions
} from "./types";

const DEFAULT_OPTIONS: WerewolfOptions = {
  sheriff: {
    enabled: true,
    voteWeight: 1.5,
    transferOnDeath: "always",
    transferMode: "self_choose",
  },
  witch: {
    canSelfSave: false,
    totalSaveCount: 1,
    totalPoisonCount: 1,
    canUseBothInSameNight: false,
  },
  hunter: {
    canShootWhenVoted: true,
    canShootWhenKilledAtNight: true,
    canShootWhenPoisoned: false,
  },
};

const ROLE_DISTRIBUTION: Record<RoleId, number> = {
  werewolf: 3,
  seer: 1,
  witch: 1,
  hunter: 1,
  villager: 4,
};

/**
 * 初始化遊戲狀態
 */
export function initializeGame(
  roomId: string,
  players: Array<{ playerId: string; socketId: string; nickname: string }>
): GameState {
  if (players.length !== 10) {
    throw new Error("狼人殺需要正好 10 位玩家");
  }

  // 隨機分配角色
  const roles: RoleId[] = [];
  for (const [role, count] of Object.entries(ROLE_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      roles.push(role as RoleId);
    }
  }
  // 打亂順序
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  const playerStates: PlayerState[] = players.map((p, index) => ({
    playerId: p.playerId,
    socketId: p.socketId,
    seatNumber: index + 1,
    nickname: p.nickname,
    role: roles[index],
    alive: true,
    isSheriff: false,
    hunterGesture: null,
    witchSaveUsed: false,
    witchPoisonUsed: false,
    seerChecks: [],
  }));

  return {
    roomId,
    phase: "setup",
    step: "setup:assign_roles",
    players: playerStates,
    readyPlayers: [],
    options: DEFAULT_OPTIONS,
    nightResult: null,
    history: [],
    winner: null,
    sheriffElection: null,
    dayVoting: null,
    hunterShot: null,
  };
}

/**
 * 檢查勝負條件
 */
export function checkVictory(state: GameState): "werewolves" | "villagers" | null {
  const alivePlayers = state.players.filter((p) => p.alive);
  const aliveWerewolves = alivePlayers.filter((p) => p.role === "werewolf");
  const aliveVillagers = alivePlayers.filter((p) => p.role !== "werewolf");

  // 好人勝利：所有狼人死亡
  if (aliveWerewolves.length === 0) {
    return "villagers";
  }

  // 狼人勝利：狼人數量 >= 好人數量
  if (aliveWerewolves.length >= aliveVillagers.length) {
    return "werewolves";
  }

  return null;
}

/**
 * 取得玩家可執行的操作
 */
export function getAvailableActions(
  state: GameState,
  playerId: string,
  hostPlayerId?: string
): Array<{ type: string; label: string; payload?: Record<string, unknown> }> {
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player || !player.alive) {
    return [];
  }

  const actions: Array<{ type: string; label: string; payload?: Record<string, unknown> }> = [];

  // 根據當前階段和玩家角色決定可用操作
  switch (state.step) {
    case "setup:reveal_roles":
      // 如果玩家還沒準備，顯示準備按鈕；如果已準備，不顯示按鈕（顯示已準備狀態）
      const isReady = state.readyPlayers?.includes(playerId) || false;
      if (!isReady) {
        actions.push({ type: "ready", label: "準備開始" });
      }
      break;

    case "night:wolves_attack":
      if (player.role === "werewolf") {
        // 狼人可以選擇擊殺任何存活的玩家（包括其他狼人）
        const aliveTargets = state.players
          .filter((p) => p.alive)
          .map((p) => ({ playerId: p.playerId, nickname: p.nickname, seatNumber: p.seatNumber }));
        actions.push({
          type: "wolf:kill",
          label: "選擇擊殺目標",
          payload: { targets: aliveTargets },
        });
      }
      break;

    case "night:wolves_confirm":
      if (player.role === "werewolf") {
        // 狼人在確認階段可以改票或確認
        const aliveTargets = state.players
          .filter((p) => p.alive)
          .map((p) => ({ playerId: p.playerId, nickname: p.nickname, seatNumber: p.seatNumber }));
        actions.push({
          type: "wolf:kill",
          label: "改票（重新選擇擊殺目標）",
          payload: { targets: aliveTargets },
        });
        // 檢查是否已經確認
        const isConfirmed = state.nightResult?.wolfConfirmations?.[playerId] === true;
        if (!isConfirmed) {
          actions.push({
            type: "wolf:confirm",
            label: "確認擊殺目標",
          });
        }
      }
      break;

    case "night:witch_decide":
      if (player.role === "witch") {
        const killedByWolves = state.nightResult?.killedByWolves;
        if (killedByWolves && !player.witchSaveUsed) {
          actions.push({
            type: "witch:save",
            label: "使用解藥",
            payload: { targetId: killedByWolves },
          });
        }
        if (!player.witchPoisonUsed) {
          const aliveTargets = state.players
            .filter((p) => p.alive && p.playerId !== killedByWolves)
            .map((p) => ({ playerId: p.playerId, nickname: p.nickname, seatNumber: p.seatNumber }));
          actions.push({
            type: "witch:poison",
            label: "使用毒藥",
            payload: { targets: aliveTargets },
          });
        }
        actions.push({ type: "witch:skip", label: "跳過" });
      }
      break;

    case "night:seer_check":
      if (player.role === "seer") {
        const aliveTargets = state.players
          .filter((p) => p.alive && p.playerId !== playerId)
          .map((p) => ({ playerId: p.playerId, nickname: p.nickname, seatNumber: p.seatNumber }));
        actions.push({
          type: "seer:check",
          label: "查驗玩家",
          payload: { targets: aliveTargets },
        });
      }
      break;

    case "night:hunter_check_gesture":
      if (player.role === "hunter") {
        // 如果已經查看過手勢，顯示確認按鈕
        if (player.hunterGesture !== null) {
          actions.push({
            type: "hunter:confirm_gesture",
            label: "確認",
          });
        } else {
          // 如果還沒查看，顯示查看手勢按鈕
          actions.push({
            type: "hunter:check_gesture",
            label: "查看手勢",
          });
        }
      }
      break;

    case "sheriff:collect_candidates":
      // 所有玩家都可以選擇參選或不參選
      actions.push({ type: "sheriff:run", label: "參選警長" });
      actions.push({ type: "sheriff:skip", label: "不參選" });
      
      // 只有房主可以看到確認按鈕
      if (hostPlayerId === playerId) {
        const alivePlayers = state.players.filter((p) => p.alive);
        const playerChoices = state.sheriffElection?.playerChoices || {};
        const allSelected = alivePlayers.every((p) => playerChoices[p.playerId] !== undefined);
        
        if (allSelected && alivePlayers.length > 0) {
          actions.push({ 
            type: "sheriff:confirm_collect", 
            label: "確認並進入下一階段" 
          });
        }
      }
      break;

    case "sheriff:speeches":
      // 當前發言的候選人可以結束發言
      if (state.sheriffElection?.speechOrder[state.sheriffElection.currentSpeechIndex] === playerId) {
        actions.push({ type: "sheriff:finish_speech", label: "發言完畢" });
      }
      // 所有候選人（包括還沒發言的）都可以退水，直到最後一個發言完
      if (state.sheriffElection?.candidates.includes(playerId)) {
        const currentIndex = state.sheriffElection.currentSpeechIndex;
        const speechOrder = state.sheriffElection.speechOrder;
        // 只要還沒到最後一個發言完，就可以退水
        if (currentIndex < speechOrder.length) {
          actions.push({ type: "sheriff:withdraw", label: "退水" });
        }
      }
      break;

    case "sheriff:voting":
      if (!state.sheriffElection?.candidates.includes(playerId)) {
        const candidates = state.sheriffElection?.candidates.map((cid) => {
          const p = state.players.find((p) => p.playerId === cid);
          return { playerId: cid, nickname: p?.nickname || "", seatNumber: p?.seatNumber || 0 };
        }) || [];
        actions.push({
          type: "sheriff:vote",
          label: "投票選警長",
          payload: { candidates },
        });
      }
      break;

    case "day:hunter_night_shot":
      if (player.role === "hunter" && player.hunterGesture === "good" && state.nightResult?.killedByWolves === playerId) {
        const aliveTargets = state.players
          .filter((p) => p.alive && p.playerId !== playerId)
          .map((p) => ({ playerId: p.playerId, nickname: p.nickname, seatNumber: p.seatNumber }));
        actions.push({
          type: "hunter:shoot",
          label: "開槍",
          payload: { targets: aliveTargets },
        });
        actions.push({ type: "hunter:skip", label: "不開槍" });
      }
      break;

    case "day:voting":
      const aliveTargets = state.players
        .filter((p) => p.alive && p.playerId !== playerId)
        .map((p) => ({ playerId: p.playerId, nickname: p.nickname, seatNumber: p.seatNumber }));
      actions.push({
        type: "day:vote",
        label: "投票處決",
        payload: { targets: aliveTargets },
      });
      break;

    case "day:hunter_day_shot":
      if (player.role === "hunter" && player.hunterGesture === "good") {
        const aliveTargets = state.players
          .filter((p) => p.alive && p.playerId !== playerId)
          .map((p) => ({ playerId: p.playerId, nickname: p.nickname, seatNumber: p.seatNumber }));
        actions.push({
          type: "hunter:shoot",
          label: "開槍",
          payload: { targets: aliveTargets },
        });
        actions.push({ type: "hunter:skip", label: "不開槍" });
      }
      break;
  }

  return actions;
}

/**
 * 應用操作並更新遊戲狀態
 */
export function applyAction(state: GameState, action: GameAction): GameState {
  const newState: GameState = JSON.parse(JSON.stringify(state)); // 深拷貝
  const player = newState.players.find((p) => p.playerId === action.playerId);

  // 系統操作允許跳過玩家檢查
  if (action.playerId !== "system") {
    if (!player || !player.alive) {
      throw new Error("玩家不存在或已死亡");
    }
  }

  // 驗證操作是否合法
  // 對於 sheriff:run 和 sheriff:skip，不需要 hostPlayerId 驗證（它們在 getAvailableActions 中總是可用）
  // 對於 sheriff:confirm_collect，會在 socket server 層級驗證
  if (action.type === "sheriff:run" || action.type === "sheriff:skip") {
    // 簡單驗證：確保當前階段是 sheriff:collect_candidates
    if (newState.step !== "sheriff:collect_candidates") {
      throw new Error(`操作 ${action.type} 不合法：當前階段不是 sheriff:collect_candidates`);
    }
  } else if (action.type !== "sheriff:confirm_collect" && action.type !== "sheriff:confirm_withdraw") {
    // 對於其他操作，使用 getAvailableActions 驗證（不傳 hostPlayerId，因為這些操作不依賴它）
    const availableActions = getAvailableActions(newState, action.playerId);
    if (!availableActions.some((a) => a.type === action.type)) {
      throw new Error(`操作 ${action.type} 不合法`);
    }
  }

  // 根據操作類型更新狀態
  switch (action.type) {
    case "ready":
      // 記錄玩家已準備
      if (newState.step === "setup:reveal_roles") {
        if (!newState.readyPlayers) {
          newState.readyPlayers = [];
        }
        // 如果玩家還沒準備，加入準備列表
        if (!newState.readyPlayers.includes(action.playerId)) {
          newState.readyPlayers.push(action.playerId);
        }
        
        // 檢查是否所有玩家都準備好
        const allPlayers = newState.players;
        const readyCount = newState.readyPlayers.length;
        const totalPlayers = allPlayers.length;
        const allReady = allPlayers.every((p) => newState.readyPlayers!.includes(p.playerId));
        
        console.log(`[Ready] Player ${action.playerId} ready. Ready: ${readyCount}/${totalPlayers}, All ready: ${allReady}`);
        
        if (allReady && readyCount === totalPlayers && totalPlayers > 0) {
          // 所有玩家都準備好後，進入首夜
          console.log(`[Ready] All players ready, moving to night phase`);
          newState.step = "night:wolves_attack";
          newState.phase = "night_first";
          newState.nightResult = {
            killedByWolves: null,
            killedByPoison: null,
            savedByWitch: false,
            savedByWitchTargetId: null,
            seerCheck: null,
            hunterGesture: null,
            wolfVotes: {},
          };
          // 清除準備狀態（進入下一階段後不再需要）
          newState.readyPlayers = undefined;
        } else {
          console.log(`[Ready] Not all players ready yet. Ready: ${readyCount}/${totalPlayers}`);
        }
      }
      break;

    case "wolf:kill":
      if (player.role === "werewolf" && newState.nightResult) {
        const targetId = action.payload.targetId as string;
        
        // 初始化 wolfVotes 如果不存在
        if (!newState.nightResult.wolfVotes) {
          newState.nightResult.wolfVotes = {};
        }
        
        // 記錄這個狼人的選擇（如果是改票，會覆蓋之前的選擇）
        newState.nightResult.wolfVotes[action.playerId] = targetId;
        
        // 如果是在確認階段改票，清除這個狼人的確認狀態
        if (newState.step === "night:wolves_confirm") {
          if (newState.nightResult.wolfConfirmations) {
            delete newState.nightResult.wolfConfirmations[action.playerId];
          }
        }
        
        // 檢查是否所有存活的狼人都投票了
        const aliveWerewolves = newState.players.filter((p) => p.alive && p.role === "werewolf");
        const votedWerewolves = Object.keys(newState.nightResult.wolfVotes);
        
        if (votedWerewolves.length >= aliveWerewolves.length) {
          // 所有狼人都投票了，決定最終目標
          // 計算票數（如果有多個狼人選擇不同目標，選擇得票最多的）
          const voteCounts: Record<string, number> = {};
          for (const targetId of Object.values(newState.nightResult.wolfVotes)) {
            voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
          }
          
          // 找出得票最多的目標
          let maxVotes = 0;
          let finalTarget: string | null = null;
          for (const [targetId, votes] of Object.entries(voteCounts)) {
            if (votes > maxVotes) {
              maxVotes = votes;
              finalTarget = targetId;
            }
          }
          
          // 如果平票，選擇第一個投票的目標（或可以隨機選擇）
          if (!finalTarget && Object.keys(voteCounts).length > 0) {
            finalTarget = Object.keys(voteCounts)[0];
          }
          
          newState.nightResult.killedByWolves = finalTarget;
          
          // 如果是在投票階段，進入確認階段；如果是在確認階段改票，保持在確認階段
          if (newState.step === "night:wolves_attack") {
            newState.step = "night:wolves_confirm";
          }
          // 如果已經在確認階段，保持在確認階段（允許改票）
        }
        // 如果還有狼人沒投票，保持當前階段，等待其他狼人
      }
      break;

    case "wolf:confirm":
      if (player.role === "werewolf" && newState.nightResult) {
        // 初始化確認記錄
        if (!newState.nightResult.wolfConfirmations) {
          newState.nightResult.wolfConfirmations = {};
        }

        newState.nightResult.wolfConfirmations[action.playerId] = true;

        // 當所有存活狼人都按下確認，才進入女巫階段
        const aliveWerewolvesForConfirm = newState.players.filter(
          (p) => p.alive && p.role === "werewolf"
        );
        const confirmedWerewolves = Object.keys(newState.nightResult.wolfConfirmations);

        if (confirmedWerewolves.length >= aliveWerewolvesForConfirm.length) {
          newState.step = "night:witch_decide";
        }
      }
      break;

    case "witch:save":
      if (player.role === "witch" && newState.nightResult && !player.witchSaveUsed) {
        const targetId = newState.nightResult.killedByWolves;
        newState.nightResult.savedByWitch = true;
        newState.nightResult.savedByWitchTargetId = targetId; // 記錄銀水
        newState.nightResult.killedByWolves = null;
        player.witchSaveUsed = true;
        newState.step = "night:seer_check";
      }
      break;

    case "witch:poison":
      if (player.role === "witch" && newState.nightResult && !player.witchPoisonUsed) {
        const targetId = action.payload.targetId as string;
        newState.nightResult.killedByPoison = targetId;
        player.witchPoisonUsed = true;
        // 如果已經用了解藥，不能同時用毒藥
        if (!newState.options.witch.canUseBothInSameNight && newState.nightResult.savedByWitch) {
          throw new Error("不能在同一晚同時使用解藥和毒藥");
        }
        newState.step = "night:seer_check";
      }
      break;

    case "witch:skip":
      if (player.role === "witch") {
        newState.step = "night:seer_check";
      }
      break;

    case "seer:check":
      if (player.role === "seer" && newState.nightResult) {
        const targetId = action.payload.targetId as string;
        const target = newState.players.find((p) => p.playerId === targetId);
        if (target) {
          const result: "werewolf" | "villager" = target.role === "werewolf" ? "werewolf" : "villager";
          newState.nightResult.seerCheck = {
            playerId: action.playerId,
            targetId,
            result,
          };
          player.seerChecks.push({ targetId, result });
        }
        newState.step = "night:hunter_check_gesture";
      }
      break;

    case "hunter:check_gesture":
      if (player.role === "hunter" && newState.nightResult) {
        // V1 規則：只有被毒會導致 bad
        const isPoisoned = newState.nightResult.killedByPoison === action.playerId;
        player.hunterGesture = isPoisoned ? "bad" : "good";
        newState.nightResult.hunterGesture = {
          playerId: action.playerId,
          gesture: player.hunterGesture,
        };
        // 不立即進入下一階段，等待玩家確認
      }
      break;

    case "hunter:confirm_gesture":
      if (player.role === "hunter" && player.hunterGesture !== null) {
        // 確認後進入警長競選階段（首夜）或天亮（之後的夜晚）
        if (newState.phase === "night_first") {
          newState.step = "sheriff:collect_candidates";
          newState.phase = "sheriff_election";
          newState.sheriffElection = {
            candidates: [],
            speechOrder: [],
            currentSpeechIndex: 0,
            votes: {},
            playerChoices: {},
            withdrawn: [],
          };
        } else {
          newState.step = "day:apply_night_deaths";
          newState.phase = "day";
        }
      }
      break;

    case "sheriff:run":
      if (newState.sheriffElection) {
        // 記錄玩家的選擇
        if (!newState.sheriffElection.playerChoices) {
          newState.sheriffElection.playerChoices = {};
        }
        newState.sheriffElection.playerChoices[action.playerId] = "run";
        
        // 如果還沒在候選人名單中，加入
        if (!newState.sheriffElection.candidates.includes(action.playerId)) {
          newState.sheriffElection.candidates.push(action.playerId);
        }
      }
      break;

    case "sheriff:skip":
      if (newState.sheriffElection) {
        // 記錄玩家的選擇
        if (!newState.sheriffElection.playerChoices) {
          newState.sheriffElection.playerChoices = {};
        }
        newState.sheriffElection.playerChoices[action.playerId] = "skip";
        
        // 如果玩家在候選人名單中，移除（允許改選）
        const candidateIndex = newState.sheriffElection.candidates.indexOf(action.playerId);
        if (candidateIndex > -1) {
          newState.sheriffElection.candidates.splice(candidateIndex, 1);
        }
      }
      break;

    case "sheriff:confirm_collect":
      if (newState.sheriffElection) {
        // 檢查是否所有人都已選擇
        const alivePlayers = newState.players.filter((p) => p.alive);
        const playerChoices = newState.sheriffElection.playerChoices || {};
        const allSelected = alivePlayers.every((p) => playerChoices[p.playerId] !== undefined);
        
        if (!allSelected) {
          throw new Error("還有玩家未選擇");
        }
        
        // 如果有候選人，進入發言階段；如果沒有，跳過警長競選
        if (newState.sheriffElection.candidates.length > 0) {
          // 初始化 withdrawn 陣列
          if (!newState.sheriffElection.withdrawn) {
            newState.sheriffElection.withdrawn = [];
          }
          // 隨機決定發言順序
          const candidates = [...newState.sheriffElection.candidates];
          for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
          }
          newState.sheriffElection.speechOrder = candidates;
          newState.sheriffElection.currentSpeechIndex = 0;
          newState.step = "sheriff:speeches";
        } else {
          // 無人參選，跳過警長競選
          newState.step = "day:apply_night_deaths";
          newState.phase = "day";
          newState.sheriffElection = null;
        }
      }
      break;

    case "sheriff:finish_speech":
      if (newState.sheriffElection) {
        newState.sheriffElection.currentSpeechIndex++;
        if (newState.sheriffElection.currentSpeechIndex >= newState.sheriffElection.speechOrder.length) {
          // 所有發言完後，進入退水階段
          newState.step = "sheriff:withdraw_after_speeches";
        }
      }
      break;

    case "sheriff:withdraw":
      if (newState.sheriffElection) {
        // 確保 withdrawn 陣列存在
        if (!newState.sheriffElection.withdrawn) {
          newState.sheriffElection.withdrawn = [];
        }
        // 如果還沒退水，加入退水列表
        if (!newState.sheriffElection.withdrawn.includes(action.playerId)) {
          newState.sheriffElection.withdrawn.push(action.playerId);
        }
        // 從候選人列表中移除
        const candidateIndex = newState.sheriffElection.candidates.indexOf(action.playerId);
        if (candidateIndex > -1) {
          newState.sheriffElection.candidates.splice(candidateIndex, 1);
        }
        // 從發言順序中移除
        const speechIndex = newState.sheriffElection.speechOrder.indexOf(action.playerId);
        if (speechIndex > -1) {
          newState.sheriffElection.speechOrder.splice(speechIndex, 1);
          // 如果退水的是當前發言者或之前的發言者，需要調整 currentSpeechIndex
          if (speechIndex <= newState.sheriffElection.currentSpeechIndex) {
            newState.sheriffElection.currentSpeechIndex = Math.max(0, newState.sheriffElection.currentSpeechIndex - 1);
          }
        }
        // 如果在發言階段且所有候選人都退水了，跳過投票階段
        if (newState.step === "sheriff:speeches" && newState.sheriffElection.candidates.length === 0) {
          newState.step = "day:apply_night_deaths";
          newState.phase = "day";
          newState.sheriffElection = null;
        }
      }
      break;

    case "sheriff:vote":
      if (newState.sheriffElection) {
        // 驗證：只有警下玩家（不在候選人列表且不在退水列表）可以投票
        const isCandidate = newState.sheriffElection.candidates.includes(action.playerId);
        const isWithdrawn = newState.sheriffElection.withdrawn?.includes(action.playerId) || false;
        if (isCandidate || isWithdrawn) {
          throw new Error("候選人和退水玩家不能投票");
        }
        
        const candidateId = action.payload.candidateId as string;
        newState.sheriffElection.votes[action.playerId] = candidateId;
        // 檢查是否所有警下玩家都投票了
        const alivePlayers = newState.players.filter((p) => p.alive);
        const voters = alivePlayers.filter((p) => 
          !newState.sheriffElection!.candidates.includes(p.playerId) &&
          !newState.sheriffElection!.withdrawn?.includes(p.playerId)
        );
        if (Object.keys(newState.sheriffElection.votes).length >= voters.length) {
          // 計算票數（警長 1.5 票）
          const voteCounts: Record<string, number> = {};
          for (const [voterId, candidateId] of Object.entries(newState.sheriffElection.votes)) {
            const voter = newState.players.find((p) => p.playerId === voterId);
            const weight = voter?.isSheriff ? newState.options.sheriff.voteWeight : 1;
            voteCounts[candidateId] = (voteCounts[candidateId] || 0) + weight;
          }
          // 找出得票最多的候選人
          let maxVotes = 0;
          let winner: string | null = null;
          for (const [candidateId, votes] of Object.entries(voteCounts)) {
            if (votes > maxVotes) {
              maxVotes = votes;
              winner = candidateId;
            }
          }
          if (winner) {
            const winnerPlayer = newState.players.find((p) => p.playerId === winner);
            if (winnerPlayer) {
              winnerPlayer.isSheriff = true;
            }
          }
          newState.step = "day:apply_night_deaths";
          newState.phase = "day";
          newState.sheriffElection = null;
        }
      }
      break;

    case "day:apply_night_deaths":
      // 這個步驟應該自動執行，不應該由玩家觸發
      // 套用夜晚死亡結果
      if (newState.nightResult) {
        if (newState.nightResult.killedByWolves && !newState.nightResult.savedByWitch) {
          const killed = newState.players.find((p) => p.playerId === newState.nightResult!.killedByWolves);
          if (killed) {
            killed.alive = false;
          }
        }
        if (newState.nightResult.killedByPoison) {
          const killed = newState.players.find((p) => p.playerId === newState.nightResult!.killedByPoison);
          if (killed) {
            killed.alive = false;
          }
        }
      }
      // 檢查勝負
      const winner = checkVictory(newState);
      if (winner) {
        newState.winner = winner;
        newState.phase = "finished";
        newState.step = null;
      } else {
        // 自動進入公布死訊階段
        newState.step = "day:announce_deaths";
        // 檢查獵人夜槍
        const nightKilledHunter = newState.players.find(
          (p) => p.role === "hunter" && !p.alive && p.hunterGesture === "good" && newState.nightResult?.killedByWolves === p.playerId && !newState.nightResult.savedByWitch
        );
        if (nightKilledHunter) {
          newState.step = "day:hunter_night_shot";
          newState.hunterShot = {
            playerId: nightKilledHunter.playerId,
            targetId: null,
          };
        } else {
          newState.step = "day:speeches";
        }
      }
      break;

    case "day:announce_deaths":
      // 這個步驟應該自動執行
      // 檢查獵人夜槍
      const nightKilledHunter = newState.players.find(
        (p) => p.role === "hunter" && !p.alive && p.hunterGesture === "good" && newState.nightResult?.killedByWolves === p.playerId && !newState.nightResult.savedByWitch
      );
      if (nightKilledHunter) {
        newState.step = "day:hunter_night_shot";
        newState.hunterShot = {
          playerId: nightKilledHunter.playerId,
          targetId: null,
        };
      } else {
        newState.step = "day:speeches";
      }
      break;

    case "hunter:shoot":
      if (player.role === "hunter" && newState.hunterShot) {
        const targetId = action.payload.targetId as string;
        newState.hunterShot.targetId = targetId;
        const target = newState.players.find((p) => p.playerId === targetId);
        if (target) {
          target.alive = false;
        }
        // 檢查勝負
        const winnerAfterShot = checkVictory(newState);
        if (winnerAfterShot) {
          newState.winner = winnerAfterShot;
          newState.phase = "finished";
          newState.step = null;
        } else {
          newState.step = "day:speeches";
        }
        newState.hunterShot = null;
      }
      break;

    case "hunter:skip":
      if (player.role === "hunter" && newState.hunterShot) {
        newState.hunterShot = null;
        newState.step = "day:speeches";
      }
      break;

    case "day:vote":
      if (!newState.dayVoting) {
        newState.dayVoting = {
          votes: {},
          finished: false,
        };
      }
      const targetId = action.payload.targetId as string;
      newState.dayVoting.votes[action.playerId] = targetId;
      // 檢查是否所有人都投票了
      const alivePlayersForVote = newState.players.filter((p) => p.alive);
      if (Object.keys(newState.dayVoting.votes).length >= alivePlayersForVote.length) {
        // 計算票數
        const voteCounts: Record<string, number> = {};
        for (const [voterId, votedId] of Object.entries(newState.dayVoting.votes)) {
          const voter = newState.players.find((p) => p.playerId === voterId);
          const weight = voter?.isSheriff ? newState.options.sheriff.voteWeight : 1;
          voteCounts[votedId] = (voteCounts[votedId] || 0) + weight;
        }
        // 找出得票最多的
        let maxVotes = 0;
        let votedOut: string | null = null;
        for (const [playerId, votes] of Object.entries(voteCounts)) {
          if (votes > maxVotes) {
            maxVotes = votes;
            votedOut = playerId;
          }
        }
        // V1 簡化：平票無人出局，直接入夜
        const tied = Object.values(voteCounts).filter((v) => v === maxVotes).length > 1;
        if (!tied && votedOut) {
          const votedOutPlayer = newState.players.find((p) => p.playerId === votedOut);
          if (votedOutPlayer) {
            votedOutPlayer.alive = false;
            // 檢查是否為獵人且可開槍
            if (votedOutPlayer.role === "hunter" && votedOutPlayer.hunterGesture === "good") {
              newState.step = "day:hunter_day_shot";
              newState.hunterShot = {
                playerId: votedOutPlayer.playerId,
                targetId: null,
              };
            } else {
              // 檢查勝負
              const winnerAfterVote = checkVictory(newState);
              if (winnerAfterVote) {
                newState.winner = winnerAfterVote;
                newState.phase = "finished";
                newState.step = null;
              } else {
                // 進入下一夜
                newState.step = "night:wolves_attack";
                newState.phase = "night_regular";
                newState.nightResult = {
                  killedByWolves: null,
                  killedByPoison: null,
                  savedByWitch: false,
                  savedByWitchTargetId: null,
                  seerCheck: null,
                  hunterGesture: null,
                  wolfVotes: {},
                };
                newState.dayVoting = null;
              }
            }
          }
        } else {
          // 平票，直接入夜
          newState.step = "night:wolves_attack";
          newState.phase = "night_regular";
          newState.nightResult = {
            killedByWolves: null,
            killedByPoison: null,
            savedByWitch: false,
            savedByWitchTargetId: null,
            seerCheck: null,
            hunterGesture: null,
            wolfVotes: {},
          };
          newState.dayVoting = null;
        }
      }
      break;
  }

  // 記錄操作歷史
  newState.history.push(action);

  return newState;
}

/**
 * 生成玩家視角
 */
export function getPlayerView(state: GameState, playerId: string, hostPlayerId?: string): PlayerView {
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player) {
    throw new Error("玩家不存在");
  }

  const alivePlayers = state.players.filter((p) => p.alive);
  const deadPlayers = state.players.filter((p) => !p.alive);

  const nightDeaths: Array<{ playerId: string; nickname: string; cause: "wolf" | "poison" | "vote" | "hunter" }> =
    [];
  // 昨晚死亡資訊只在白天階段公開，夜晚僅女巫透過 nightInfo 查看
  if (state.phase === "day" && state.nightResult) {
    if (state.nightResult.killedByWolves && !state.nightResult.savedByWitch) {
      const killed = state.players.find((p) => p.playerId === state.nightResult!.killedByWolves);
      if (killed) {
        nightDeaths.push({ playerId: killed.playerId, nickname: killed.nickname, cause: "wolf" });
      }
    }
    if (state.nightResult.killedByPoison) {
      const killed = state.players.find((p) => p.playerId === state.nightResult!.killedByPoison);
      if (killed) {
        nightDeaths.push({ playerId: killed.playerId, nickname: killed.nickname, cause: "poison" });
      }
    }
  }

  // 狼人專用資訊（只在是狼人時提供）
  let wolfInfo:
    | {
        votes: Array<{
          wolfId: string;
          wolfSeatNumber: number;
          wolfNickname: string;
          targetId: string | null;
          targetSeatNumber: number | null;
          targetNickname: string | null;
        }>;
        finalTargetId: string | null;
        confirmations: Array<{
          wolfId: string;
          wolfSeatNumber: number;
          wolfNickname: string;
          confirmed: boolean;
        }>;
      }
    | undefined;

  if (player.role === "werewolf" && state.nightResult?.wolfVotes) {
    const votes = Object.entries(state.nightResult.wolfVotes).map(([wolfId, targetId]) => {
      const wolf = state.players.find((p) => p.playerId === wolfId);
      const target = targetId ? state.players.find((p) => p.playerId === targetId) : undefined;
      return {
        wolfId,
        wolfSeatNumber: wolf?.seatNumber ?? 0,
        wolfNickname: wolf?.nickname ?? "未知",
        targetId: targetId || null,
        targetSeatNumber: target?.seatNumber ?? null,
        targetNickname: target?.nickname ?? null,
      };
    });

    // 取得所有存活狼人的確認狀態
    const aliveWerewolves = state.players.filter((p) => p.alive && p.role === "werewolf");
    const confirmations = aliveWerewolves.map((wolf) => ({
      wolfId: wolf.playerId,
      wolfSeatNumber: wolf.seatNumber,
      wolfNickname: wolf.nickname,
      confirmed: state.nightResult?.wolfConfirmations?.[wolf.playerId] === true,
    }));

    wolfInfo = {
      votes,
      finalTargetId: state.nightResult.killedByWolves ?? null,
      confirmations,
    };
  }

  return {
    public: {
      phase: state.phase,
      step: state.step,
      alivePlayers: alivePlayers.map((p) => ({
        playerId: p.playerId,
        seatNumber: p.seatNumber,
        nickname: p.nickname,
        isSheriff: p.isSheriff,
      })),
      deadPlayers: deadPlayers.map((p) => ({
        playerId: p.playerId,
        seatNumber: p.seatNumber,
        nickname: p.nickname,
        isSheriff: p.isSheriff,
      })),
      nightDeaths,
      winner: state.winner,
      sheriffElection: state.sheriffElection
        ? {
            candidates: state.sheriffElection.candidates,
            currentSpeaker:
              state.sheriffElection.speechOrder[state.sheriffElection.currentSpeechIndex] || null,
            votes: state.sheriffElection.votes,
          }
        : null,
      dayVoting: state.dayVoting,
      readyPlayers: state.step === "setup:reveal_roles" ? state.readyPlayers : undefined,
    },
    private: {
      playerId: player.playerId,
      seatNumber: player.seatNumber,
      nickname: player.nickname,
      role: player.role,
      alive: player.alive,
      isSheriff: player.isSheriff,
      seerChecks: player.seerChecks,
      hunterGesture: player.hunterGesture,
      witchSaveUsed: player.witchSaveUsed,
      witchPoisonUsed: player.witchPoisonUsed,
      nightInfo:
        player.role === "witch" && state.nightResult
          ? {
              killedByWolves: state.nightResult.killedByWolves,
              killedByPoison: state.nightResult.killedByPoison,
              savedByWitchTargetId: state.nightResult.savedByWitchTargetId,
            }
          : null,
      wolfInfo,
      sheriffChoice: state.sheriffElection?.playerChoices?.[playerId] || null,
    },
    availableActions: getAvailableActions(state, playerId, hostPlayerId),
  };
}
