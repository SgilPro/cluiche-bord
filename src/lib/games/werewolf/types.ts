/**
 * 狼人殺遊戲型別定義
 */

export type PhaseId = "setup" | "night_first" | "night_regular" | "sheriff_election" | "day" | "finished";

export type StepId =
  | "setup:assign_roles"
  | "setup:reveal_roles"
  | "night:wolves_attack"
  | "night:wolves_confirm"
  | "night:witch_decide"
  | "night:seer_check"
  | "night:hunter_check_gesture"
  | "sheriff:collect_candidates"
  | "sheriff:randomize_order"
  | "sheriff:speeches"
  | "sheriff:withdraw_after_speeches"
  | "sheriff:voting"
  | "day:apply_night_deaths"
  | "day:announce_deaths"
  | "day:hunter_night_shot"
  | "day:speeches"
  | "day:voting"
  | "day:hunter_day_shot";

export type RoleId = "werewolf" | "seer" | "witch" | "hunter" | "villager";

export interface PlayerState {
  playerId: string;
  socketId: string; // Socket.IO socket.id
  seatNumber: number; // 1..10，加入順序 = 座位順序
  nickname: string;
  role: RoleId | null; // null 表示尚未分配
  alive: boolean;
  isSheriff: boolean;
  hunterGesture: "good" | "bad" | null; // null 表示尚未設定
  // 女巫狀態
  witchSaveUsed: boolean;
  witchPoisonUsed: boolean;
  // 預言家查驗記錄（私有）
  seerChecks: Array<{ targetId: string; result: "werewolf" | "villager" }>;
}

export interface WerewolfOptions {
  sheriff: {
    enabled: boolean;
    voteWeight: number; // 1.5
    transferOnDeath: "always";
    transferMode: "self_choose";
  };
  witch: {
    canSelfSave: boolean; // V1: false
    totalSaveCount: number; // V1: 1
    totalPoisonCount: number; // V1: 1
    canUseBothInSameNight: boolean; // V1: false
  };
  hunter: {
    canShootWhenVoted: boolean; // true
    canShootWhenKilledAtNight: boolean; // true
    canShootWhenPoisoned: boolean; // false
  };
}

export interface NightResult {
  killedByWolves: string | null; // playerId (最終決定)
  killedByPoison: string | null; // playerId
  savedByWitch: boolean;
  savedByWitchTargetId: string | null; // playerId，被女巫救的玩家（銀水）
  seerCheck: {
    playerId: string;
    targetId: string;
    result: "werewolf" | "villager";
  } | null;
  hunterGesture: {
    playerId: string;
    gesture: "good" | "bad";
  } | null;
  wolfVotes?: Record<string, string>; // 狼人的投票記錄 { playerId: targetId }
  wolfConfirmations?: Record<string, boolean>; // 狼人是否已確認最終目標
}

export interface GameAction {
  type: string; // 如 "wolf:kill", "witch:save", "seer:check", "vote", "hunter:shoot" 等
  playerId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  phase: PhaseId;
  step: StepId | null;
  players: PlayerState[];
  options: WerewolfOptions;
  nightResult: NightResult | null;
  history: GameAction[];
  winner: "werewolves" | "villagers" | null;
  readyPlayers?: string[]; // 已準備的玩家 playerId 陣列
  // 警長競選相關
  sheriffElection: {
    candidates: string[]; // playerId[]
    speechOrder: string[]; // playerId[]，發言順序
    currentSpeechIndex: number;
    votes: Record<string, string>; // playerId -> candidateId
    playerChoices?: Record<string, "run" | "skip">; // 記錄每個玩家的選擇狀態
    withdrawn: string[]; // playerId[]，退水的玩家（不能投票）
    hostPlayerId?: string; // 房主 playerId（用於確認操作）
  } | null;
  // 白天投票相關
  dayVoting: {
    votes: Record<string, string>; // playerId -> targetId
    finished: boolean;
  } | null;
  // 獵人開槍相關
  hunterShot: {
    playerId: string;
    targetId: string | null; // null 表示尚未選擇
  } | null;
}

export interface PlayerView {
  // 公開資訊（所有人都看得到）
  public: {
    phase: PhaseId;
    step: StepId | null;
    alivePlayers: Array<{
      playerId: string;
      seatNumber: number;
      nickname: string;
      isSheriff: boolean;
    }>;
    deadPlayers: Array<{
      playerId: string;
      seatNumber: number;
      nickname: string;
      isSheriff: boolean;
    }>;
    nightDeaths: Array<{
      playerId: string;
      nickname: string;
      cause: "wolf" | "poison" | "vote" | "hunter";
    }>;
    winner: "werewolves" | "villagers" | null;
    // 警長競選狀態
    sheriffElection: {
      candidates: string[];
      currentSpeaker: string | null;
      votes: Record<string, string>;
      collectStartTime?: number;
      collectDuration?: number;
      collectEnded?: boolean; // 倒數計時是否已結束
    } | null;
    // 白天投票狀態
    dayVoting: {
      votes: Record<string, string>;
      finished: boolean;
    } | null;
    // 準備狀態（僅在 setup:reveal_roles 階段）
    readyPlayers?: string[]; // 已準備的玩家 playerId 陣列
  };
  // 私有資訊（只有該玩家看得到）
  private: {
    playerId: string;
    seatNumber: number;
    nickname: string;
    role: RoleId | null;
    alive: boolean;
    isSheriff: boolean;
    // 預言家查驗記錄
    seerChecks: Array<{ targetId: string; result: "werewolf" | "villager" }>;
    // 獵人手勢
    hunterGesture: "good" | "bad" | null;
    // 女巫狀態
    witchSaveUsed: boolean;
    witchPoisonUsed: boolean;
    // 夜晚資訊（僅限相關角色）
    nightInfo: {
      killedByWolves: string | null; // 女巫會看到
      killedByPoison: string | null; // 公開資訊
      savedByWitchTargetId: string | null; // 銀水（被女巫救的玩家）
    } | null;
    // 狼人資訊（僅狼人可見）
    wolfInfo?: {
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
    };
    // 警長競選選擇狀態（僅該玩家可見）
    sheriffChoice?: "run" | "skip" | null;
  };
  // 可用操作
  availableActions: Array<{
    type: string;
    label: string;
    payload?: Record<string, unknown>;
  }>;
}
