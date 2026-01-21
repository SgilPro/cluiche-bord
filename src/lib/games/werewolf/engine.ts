/**
 * 狼人殺遊戲引擎核心邏輯
 */

import type {
  GameState,
  PlayerState,
  PlayerView,
  RoleId,
  PhaseId,
  StepId,
  WerewolfOptions,
  NightResult,
  GameAction,
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
  playerId: string
): Array<{ type: string; label: string; payload?: Record<string, unknown> }> {
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player || !player.alive) {
    return [];
  }

  const actions: Array<{ type: string; label: string; payload?: Record<string, unknown> }> = [];

  // 根據當前階段和玩家角色決定可用操作
  switch (state.step) {
    case "setup:reveal_roles":
      actions.push({ type: "ready", label: "準備開始" });
      break;

    case "night:wolves_attack":
      if (player.role === "werewolf") {
        const aliveTargets = state.players
          .filter((p) => p.alive && p.role !== "werewolf")
          .map((p) => ({ playerId: p.playerId, nickname: p.nickname, seatNumber: p.seatNumber }));
        actions.push({
          type: "wolf:kill",
          label: "選擇擊殺目標",
          payload: { targets: aliveTargets },
        });
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

    case "sheriff:collect_candidates":
      actions.push({ type: "sheriff:run", label: "參選警長" });
      actions.push({ type: "sheriff:skip", label: "不參選" });
      break;

    case "sheriff:speeches":
      if (state.sheriffElection?.speechOrder[state.sheriffElection.currentSpeechIndex] === playerId) {
        actions.push({ type: "sheriff:finish_speech", label: "發言完畢" });
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
  const availableActions = getAvailableActions(newState, action.playerId);
  if (!availableActions.some((a) => a.type === action.type)) {
    throw new Error(`操作 ${action.type} 不合法`);
  }

  // 根據操作類型更新狀態
  switch (action.type) {
    case "ready":
      // 所有玩家都準備好後，進入首夜
      // 簡化：假設所有玩家都準備好後自動進入首夜
      if (newState.step === "setup:reveal_roles") {
        newState.step = "night:wolves_attack";
        newState.phase = "night_first";
        newState.nightResult = {
          killedByWolves: null,
          killedByPoison: null,
          savedByWitch: false,
          seerCheck: null,
          hunterGesture: null,
        };
      }
      break;

    case "wolf:kill":
      if (player.role === "werewolf" && newState.nightResult) {
        const targetId = action.payload.targetId as string;
        newState.nightResult.killedByWolves = targetId;
        // 檢查是否所有狼人都投票了（簡化：只要有一個狼人投票就進入下一步）
        newState.step = "night:witch_decide";
      }
      break;

    case "witch:save":
      if (player.role === "witch" && newState.nightResult && !player.witchSaveUsed) {
        newState.nightResult.savedByWitch = true;
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
        // 進入警長競選階段（首夜）或天亮（之後的夜晚）
        if (newState.phase === "night_first") {
          newState.step = "sheriff:collect_candidates";
          newState.phase = "sheriff_election";
          newState.sheriffElection = {
            candidates: [],
            speechOrder: [],
            currentSpeechIndex: 0,
            votes: {},
          };
        } else {
          newState.step = "day:apply_night_deaths";
          newState.phase = "day";
        }
      }
      break;

    case "sheriff:run":
      if (newState.sheriffElection && !newState.sheriffElection.candidates.includes(action.playerId)) {
        newState.sheriffElection.candidates.push(action.playerId);
      }
      break;

    case "sheriff:skip":
      // 收集候選人階段，如果所有人都選擇完畢，進入下一階段
      // 簡化：假設有至少一人參選後，由系統決定進入下一階段
      if (newState.sheriffElection && newState.sheriffElection.candidates.length > 0) {
        // 隨機決定發言順序
        const candidates = [...newState.sheriffElection.candidates];
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        newState.sheriffElection.speechOrder = candidates;
        newState.sheriffElection.currentSpeechIndex = 0;
        newState.step = "sheriff:speeches";
      } else if (newState.sheriffElection && newState.sheriffElection.candidates.length === 0) {
        // 無人參選，跳過警長競選
        newState.step = "day:apply_night_deaths";
        newState.phase = "day";
        newState.sheriffElection = null;
      }
      break;

    case "sheriff:finish_speech":
      if (newState.sheriffElection) {
        newState.sheriffElection.currentSpeechIndex++;
        if (newState.sheriffElection.currentSpeechIndex >= newState.sheriffElection.speechOrder.length) {
          newState.step = "sheriff:voting";
        }
      }
      break;

    case "sheriff:vote":
      if (newState.sheriffElection) {
        const candidateId = action.payload.candidateId as string;
        newState.sheriffElection.votes[action.playerId] = candidateId;
        // 檢查是否所有人都投票了
        const alivePlayers = newState.players.filter((p) => p.alive);
        const voters = alivePlayers.filter((p) => !newState.sheriffElection!.candidates.includes(p.playerId));
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
                  seerCheck: null,
                  hunterGesture: null,
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
            seerCheck: null,
            hunterGesture: null,
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
export function getPlayerView(state: GameState, playerId: string): PlayerView {
  const player = state.players.find((p) => p.playerId === playerId);
  if (!player) {
    throw new Error("玩家不存在");
  }

  const alivePlayers = state.players.filter((p) => p.alive);
  const deadPlayers = state.players.filter((p) => !p.alive);

  const nightDeaths: Array<{ playerId: string; nickname: string; cause: "wolf" | "poison" | "vote" | "hunter" }> = [];
  if (state.nightResult) {
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
            }
          : null,
    },
    availableActions: getAvailableActions(state, playerId),
  };
}
