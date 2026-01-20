# 桌遊網站專案規劃書 (Cluiche Bord)

## 專案概述

建立一個類似 BoardGameArena 的桌遊網站，讓使用者可以與朋友線上遊玩各種桌遊和益智遊戲。初期專注於少數遊戲的數位化，後期將建立遊戲編輯器和模組化系統。

## 專案目標

1. **短期目標**
   - 建立基本的使用者認證系統
   - 實作遊戲房間系統
   - 開發 2-3 款示範遊戲
   - 建立即時多人遊戲功能

2. **中期目標**
   - 抽象化遊戲核心邏輯
   - 建立遊戲架構框架
   - 擴充更多遊戲內容
   - 優化使用者體驗

3. **長期目標**
   - 開發遊戲編輯器
   - 建立模組化遊戲系統
   - 支援自訂遊戲規則
   - 建立遊戲社群功能

## 技術堆疊

### 前端
- **框架**: Next.js 14 (App Router)
- **UI 庫**: React
- **樣式**: Tailwind CSS
- **狀態管理**: Zustand
- **型別檢查**: TypeScript

### 後端
- **API**: Next.js API Routes
- **資料庫**: PostgreSQL
- **ORM**: Prisma
- **快取**: Redis
- **認證**: NextAuth.js

### 即時通訊
- **WebSocket**: Socket.IO

### 開發工具
- **版本控制**: Git
- **程式碼格式化**: Prettier
- **程式碼檢查**: ESLint
- **容器化**: Docker

### 部署
- **前端**: Vercel
- **資料庫**: PostgreSQL 託管服務（見部署選項詳情）

## 資料庫部署選項與策略

### 主要託管選項比較

#### 1. Railway
- **費用**：
  - 免費試用：$5 美元信用額度
  - Hobby 計劃：$5/月（包含 $5 使用額度）
  - 使用量計費：Memory $10/GB/月, CPU $20/vCPU/月, Storage $0.15/GB/月
- **適用情況**：小型專案，使用量計費模式適合不確定流量
- **預估成本**：小型應用約 $12/月

#### 2. DigitalOcean
- **費用**：
  - 免費試用：$200 信用額度（60天）
  - PostgreSQL 最小方案：$15.15/月（1GB RAM, 1 vCPU, 10-30GB 存儲）
- **適用情況**：需要更多控制和擴展性的專案
- **預估成本**：基本方案 $15-30/月

#### 3. Supabase（開發階段推薦）
- **費用**：
  - 免費方案：500MB 存儲，適合開發和測試
  - 付費方案：$25/月起
- **優勢**：快速原型開發，內建認證和即時功能
- **限制**：vendor lock-in 風險

#### 4. 其他選項
- **ElephantSQL**：免費 20MB，付費 $5/月起
- **Heroku Postgres**：免費層有連線限制，付費 $9/月起

### 部署策略建議

#### 階段一：開發和原型（使用檔案系統）
```typescript
// 使用檔案系統進行開發
import fs from 'fs';
import path from 'path';

const ROOMS_FILE = path.join(process.cwd(), "data", "rooms.json");

// 讀取資料
const readRooms = (): Room[] => {
  try {
    const data = fs.readFileSync(ROOMS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read rooms:", error);
    return [];
  }
};

// 寫入資料
const writeRooms = (rooms: Room[]) => {
  try {
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
  } catch (error) {
    console.error("Failed to write rooms:", error);
  }
};
```

優點：
- 簡單直接，不需要額外設定
- 適合小型應用或原型開發
- 資料持久化，重啟後資料還在
- 快速開發和測試

缺點：
- 效能較差，每次讀寫都要 I/O 操作
- 不適合多伺服器部署
- 檔案鎖定可能造成問題
- 擴展性有限

#### 階段二：Redis 快取層（效能優化）
```typescript
// 使用 Redis 作為快取
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// 房間資料結構
interface Room {
  id: string;
  name: string;
  maxPlayers: number;
  players: string[];
  createdAt: string;
  lastActivity: string;
}

// 使用 Redis 的 Hash 結構儲存房間
const saveRoom = async (room: Room) => {
  await redis.hset(`room:${room.id}`, room);
  // 設定過期時間為 1 小時
  await redis.expire(`room:${room.id}`, 3600);
};

// 使用 Redis 的 Sorted Set 追蹤房間活動時間
const updateRoomActivity = async (roomId: string) => {
  await redis.zadd('room:activities', Date.now(), roomId);
};
```

優點：
- 極快的讀寫速度（記憶體操作）
- 支援多伺服器部署
- 內建過期機制（TTL）
- 原子操作，避免競態條件

#### 階段三：完整資料庫（生產環境）
```typescript
// 使用 PostgreSQL 作為主要儲存
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// 使用 Prisma 作為 ORM
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

### 遷移性設計原則

為了確保未來能順利遷移，我們採用以下架構：

```typescript
// lib/db/types.ts
export interface DatabaseAdapter {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
}

// lib/db/file-adapter.ts
export class FileAdapter implements DatabaseAdapter {
  constructor(private filePath: string) {}
  
  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    // 檔案系統實作
  }
}

// lib/db/redis-adapter.ts
export class RedisAdapter implements DatabaseAdapter {
  constructor(private redis: Redis) {}
  
  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    // Redis 實作
  }
}

// lib/db/postgres-adapter.ts
export class PostgresAdapter implements DatabaseAdapter {
  constructor(private pool: Pool) {}
  
  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    // PostgreSQL 實作
  }
}

// lib/db/index.ts
export const db = process.env.NODE_ENV === 'development' 
  ? new FileAdapter(ROOMS_FILE)
  : process.env.USE_REDIS
    ? new RedisAdapter(redis)
    : new PostgresAdapter(pool);
```

### 遷移步驟規劃

#### 從 Supabase 到其他平台

1. **數據遷移**
```bash
# 匯出 Supabase 數據
pg_dump "postgresql://user:pass@db.supabase.co:5432/postgres" > backup.sql

# 匯入到新平台
psql "postgresql://user:pass@new-host:port/db" < backup.sql
```

2. **程式碼調整重點**
- 認證系統：從 Supabase Auth 切換到 NextAuth.js
- 即時功能：從 Supabase Realtime 切換到 Socket.IO
- 檔案存儲：從 Supabase Storage 切換到其他解決方案

3. **環境變數更新**
```env
# 開發環境 (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# 生產環境
DATABASE_URL=postgresql://user:pass@host:port/db
NEXTAUTH_SECRET=your-secret
```

### 建議的發展路徑

1. **第一階段（開發）**：檔案系統
   - 快速原型開發
   - 測試核心遊戲邏輯
   - 避免過度依賴外部服務

2. **第二階段（優化）**：Redis
   - 改善效能
   - 支援多伺服器部署
   - 實作自動過期機制

3. **第三階段（生產）**：PostgreSQL + Redis
   - 資料持久化
   - 完整的資料庫功能
   - 快取層優化

## 專案架構

```
cluiche-bord/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 認證相關頁面
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── games/                   # 遊戲相關頁面
│   │   ├── [gameId]/           # 動態遊戲頁面
│   │   ├── lobby/              # 遊戲大廳
│   │   └── page.tsx            # 遊戲列表
│   ├── profile/                # 個人資料
│   ├── api/                    # API Routes
│   │   ├── auth/               # 認證 API
│   │   ├── games/              # 遊戲 API
│   │   ├── rooms/              # 房間 API
│   │   └── socket/             # Socket.IO 處理
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                  # 共用元件
│   ├── ui/                     # 基礎 UI 元件
│   ├── game/                   # 遊戲相關元件
│   ├── auth/                   # 認證元件
│   └── layout/                 # 佈局元件
├── lib/                        # 共用邏輯
│   ├── games/                  # 遊戲邏輯系統
│   │   ├── core/               # 核心抽象層
│   │   │   ├── types.ts        # 共用型別
│   │   │   ├── game-engine.ts  # 遊戲引擎
│   │   │   ├── state-manager.ts# 狀態管理
│   │   │   └── event-handler.ts# 事件處理
│   │   ├── registry/           # 遊戲註冊系統
│   │   │   └── index.ts
│   │   ├── tic-tac-toe/        # 井字遊戲
│   │   │   ├── logic.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   ├── chess/              # 西洋棋
│   │   │   ├── logic.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   └── index.ts            # 遊戲入口
│   ├── auth/                   # 認證相關
│   │   ├── config.ts
│   │   └── providers.ts
│   ├── db/                     # 資料庫相關
│   │   ├── client.ts
│   │   └── queries.ts
│   ├── socket/                 # Socket.IO 設定
│   │   ├── client.ts
│   │   └── server.ts
│   └── utils/                  # 工具函式
├── prisma/                     # Prisma 設定
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── types/                      # 全域型別定義
│   ├── auth.ts
│   ├── game.ts
│   └── user.ts
├── public/                     # 靜態資源
├── docker/                     # Docker 設定
│   ├── Dockerfile
│   └── docker-compose.yml
├── docs/                       # 專案文件
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 資料庫設計

### 核心表格

```sql
-- 使用者表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 遊戲類型表
CREATE TABLE game_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    min_players INTEGER NOT NULL,
    max_players INTEGER NOT NULL,
    estimated_time INTEGER, -- 預估遊戲時間（分鐘）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 遊戲房間表
CREATE TABLE game_rooms (
    id SERIAL PRIMARY KEY,
    game_type_id INTEGER REFERENCES game_types(id),
    name VARCHAR(255) NOT NULL,
    creator_id INTEGER REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- waiting, playing, finished
    max_players INTEGER NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    password_hash VARCHAR(255), -- 如果是私人房間
    game_state JSONB, -- 遊戲狀態
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);

-- 房間參與者表
CREATE TABLE room_participants (
    room_id INTEGER REFERENCES game_rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    player_order INTEGER NOT NULL, -- 玩家順序
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (room_id, user_id)
);

-- 遊戲記錄表
CREATE TABLE game_records (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES game_rooms(id),
    game_type_id INTEGER REFERENCES game_types(id),
    players JSONB NOT NULL, -- 參與的玩家資訊
    winner_id INTEGER REFERENCES users(id),
    game_data JSONB, -- 完整遊戲資料
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 使用者統計表
CREATE TABLE user_stats (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    total_playtime_minutes INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 遊戲架構設計

### 核心抽象層

```typescript
// 遊戲狀態介面
interface GameState {
    id: string;
    type: string;
    players: Player[];
    currentTurn: number;
    status: 'waiting' | 'playing' | 'paused' | 'finished';
    history: GameAction[];
    metadata: Record<string, any>;
}

// 遊戲動作介面
interface GameAction {
    type: string;
    playerId: string;
    timestamp: number;
    payload: any;
}

// 遊戲邏輯介面
interface GameLogic {
    initialize(config: GameConfig): GameState;
    validateAction(state: GameState, action: GameAction): boolean;
    applyAction(state: GameState, action: GameAction): GameState;
    checkGameEnd(state: GameState): GameEndResult | null;
    getValidActions(state: GameState, playerId: string): string[];
}

// 遊戲設定介面
interface GameConfig {
    gameType: string;
    players: Player[];
    settings: Record<string, any>;
}
```

### 遊戲註冊系統

```typescript
class GameRegistry {
    private games = new Map<string, GameLogic>();
    
    register(gameType: string, logic: GameLogic): void;
    getGame(gameType: string): GameLogic;
    listGames(): GameInfo[];
    validateGameType(gameType: string): boolean;
}
```

## 開發階段規劃

### 第一階段：基礎建設 (2-3 週)

**目標**: 建立專案基礎架構

**任務清單**:
- [ ] 初始化 Next.js 專案
- [ ] 設定 TypeScript 和開發工具
- [ ] 建立基本專案結構
- [ ] 設定 Prisma 和資料庫
- [ ] 實作 NextAuth.js 認證系統
- [ ] 建立基本 UI 元件庫
- [ ] 設定 Socket.IO 基礎架構

**交付成果**:
- 可運行的 Next.js 應用程式
- 使用者註冊/登入功能
- 基本的專案文件

### 第二階段：核心功能 (3-4 週)

**目標**: 實作遊戲房間系統和第一款遊戲

**任務清單**:
- [ ] 建立遊戲房間 CRUD API
- [ ] 實作房間列表和搜尋功能
- [ ] 開發即時房間狀態同步
- [ ] 設計遊戲核心抽象層
- [ ] 實作井字遊戲（作為示範）
- [ ] 建立遊戲 UI 框架
- [ ] 實作基本的遊戲歷史記錄

**交付成果**:
- 完整的房間系統
- 可遊玩的井字遊戲
- 即時多人遊戲功能

### 第三階段：遊戲擴展 (4-5 週)

**目標**: 增加更多遊戲和優化體驗

**任務清單**:
- [ ] 實作第二款遊戲（例如：連線遊戲）
- [ ] 建立遊戲統計系統
- [ ] 優化遊戲 UI/UX
- [ ] 實作觀戰功能
- [ ] 建立使用者個人資料頁面
- [ ] 實作遊戲回放功能
- [ ] 加入遊戲設定選項

**交付成果**:
- 多款可遊玩的遊戲
- 完整的使用者體驗
- 遊戲統計和歷史功能

### 第四階段：進階功能 (5-6 週)

**目標**: 遊戲編輯器原型和系統優化

**任務清單**:
- [ ] 設計遊戲編輯器架構
- [ ] 實作基本的規則編輯功能
- [ ] 建立遊戲模板系統
- [ ] 實作自訂遊戲功能
- [ ] 效能優化和快取系統
- [ ] 實作通知系統
- [ ] 加入好友系統

**交付成果**:
- 遊戲編輯器原型
- 自訂遊戲功能
- 優化的系統效能

## 開發流程

### 版本控制策略
- **主分支**: `main` - 穩定版本
- **開發分支**: `develop` - 開發中功能
- **功能分支**: `feature/*` - 新功能開發
- **修復分支**: `hotfix/*` - 緊急修復

### 程式碼品質
- 使用 ESLint 和 Prettier 確保程式碼風格一致
- 每個 PR 必須通過程式碼審查
- 使用 TypeScript 確保型別安全
- 撰寫單元測試（覆蓋率目標 80%）

### 部署策略
- **開發環境**: 自動部署到 Vercel Preview
- **測試環境**: 手動部署到 Staging
- **生產環境**: 經過審查後部署到 Production

## 效能考量

### 前端優化
- 使用 Next.js 的 Server Components 和 Client Components
- 實作遊戲狀態的本地快取
- 使用 React.memo 優化不必要的重新渲染
- 圖片和靜態資源優化

### 後端優化
- 資料庫查詢優化和索引設計
- 使用 Redis 快取遊戲狀態
- API 回應快取策略
- WebSocket 連線管理和負載平衡

### 擴展性考量
- 設計支援水平擴展的架構
- 使用微服務架構準備（如需要）
- 資料庫分片策略（長期）
- CDN 和靜態資源分離

## 安全考量

### 認證和授權
- 使用 JWT token 進行身份驗證
- 實作適當的權限控制
- API rate limiting
- CSRF 保護

### 遊戲安全
- 伺服器端驗證所有遊戲動作
- 防止作弊和外掛
- 遊戲狀態完整性檢查
- 安全的隨機數生成

### 資料保護
- 敏感資料加密存儲
- 使用 HTTPS 進行所有通訊
- 定期備份策略
- GDPR 合規性考量

## 監控和分析

### 效能監控
- 使用 Vercel Analytics 監控前端效能
- 設定 API 回應時間監控
- 資料庫效能追蹤
- 使用者行為分析

### 錯誤追蹤
- 整合 Sentry 進行錯誤追蹤
- 設定警報機制
- 日誌管理和分析
- 使用者回饋收集

## 測試策略

### 單元測試
- 遊戲邏輯函式測試
- API 端點測試
- 元件測試

### 整合測試
- 遊戲流程端到端測試
- 多人遊戲情境測試
- 即時通訊測試

### 手動測試
- 使用者體驗測試
- 不同裝置和瀏覽器測試
- 效能測試

## 文件和知識管理

### 技術文件
- API 文件（使用 OpenAPI/Swagger）
- 遊戲邏輯文件
- 架構決策記錄（ADR）
- 部署和運維文件

### 使用者文件
- 遊戲規則說明
- 使用教學
- FAQ 常見問題

## 風險管理

### 技術風險
- 第三方服務依賴風險
- 效能瓶頸風險
- 安全漏洞風險
- 技術債務累積

### 產品風險
- 使用者接受度
- 競爭對手分析
- 功能優先級調整
- 資源分配優化

## 成功指標

### 技術指標
- 系統可用性 > 99%
- API 回應時間 < 200ms
- 程式碼覆蓋率 > 80%
- 零重大安全漏洞

### 產品指標
- 使用者註冊數
- 日活躍使用者數
- 遊戲完成率
- 使用者滿意度評分

## 後續發展

### 短期擴展
- 行動裝置支援
- 更多遊戲類型
- 社群功能擴展
- 國際化支援

### 長期願景
- 開放 API 給第三方開發者
- 遊戲市集功能
- VR/AR 遊戲支援
- AI 對戰功能

---

**備註**: 此規劃書會根據開發進度和需求變化進行定期更新。 