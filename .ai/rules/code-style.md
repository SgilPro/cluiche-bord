# 程式碼風格規範

## TypeScript 規範

### 型別定義
- **優先使用型別推斷**：讓 TypeScript 自動推斷型別，只在必要時明確指定
- **避免使用 `any`**：使用 `unknown` 或具體型別替代
- **使用介面而非型別別名**：定義物件結構時優先使用 `interface`
- **明確函式回傳型別**：複雜函式應明確指定回傳型別

```typescript
// ✅ 好的做法
interface User {
  id: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ 避免
type User = {
  id: string;
  name: string;
}

function getUser(id: any): any {
  // ...
}
```

### 命名規範
- **元件**：PascalCase（`GameRoom.tsx`）
- **函式/變數**：camelCase（`createRoom`, `userName`）
- **常數**：UPPER_SNAKE_CASE（`MAX_PLAYERS`, `API_BASE_URL`）
- **型別/介面**：PascalCase（`GameState`, `UserProfile`）
- **私有成員**：前綴底線（`_internalMethod`）

### 檔案組織
- **一個檔案一個主要導出**：每個檔案應有一個主要導出（元件、類別、函式）
- **相關型別放在同一檔案**：相關的型別定義應放在使用它們的檔案附近
- **工具函式分離**：工具函式放在 `src/lib/utils/`

## React 規範

### 元件結構
```typescript
// 1. Imports
import { useState } from 'react';
import type { User } from '@/types/user';

// 2. 型別定義
interface GameRoomProps {
  roomId: string;
  onJoin?: () => void;
}

// 3. 元件
export default function GameRoom({ roomId, onJoin }: GameRoomProps) {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. 事件處理
  const handleJoin = () => {
    // ...
  };
  
  // 6. 渲染
  return (
    // ...
  );
}
```

### Hooks 使用
- **自訂 Hooks**：重複邏輯提取為自訂 Hook，命名以 `use` 開頭
- **Hook 順序**：保持 Hook 呼叫順序一致
- **條件式 Hooks**：禁止在條件語句中呼叫 Hooks

### 效能優化
- **使用 `useMemo` 和 `useCallback`**：只在必要時使用（複雜計算、作為 props 傳遞的函式）
- **避免不必要的重新渲染**：使用 `React.memo` 包裝純元件
- **程式碼分割**：大型元件使用 `dynamic import`

## Next.js 規範

### App Router
- **伺服器元件優先**：預設使用伺服器元件，只在需要互動時使用客戶端元件
- **`'use client'` 指令**：只在必要時使用，放在檔案最上方
- **API Routes**：放在 `src/app/api/`，使用 `route.ts` 或 `route.tsx`

### 資料獲取
- **伺服器元件**：直接使用 `async/await` 獲取資料
- **客戶端元件**：使用 `useEffect` 或 SWR/React Query
- **快取策略**：適當使用 Next.js 快取選項（`cache`, `revalidate`）

## 錯誤處理

### API Routes
```typescript
// ✅ 好的做法
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return Response.json(data, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}
```

### 元件錯誤邊界
- 使用 `error.tsx` 處理路由錯誤
- 使用 `ErrorBoundary` 處理元件錯誤

## 註解規範

- **複雜邏輯必須有註解**：解釋「為什麼」而非「做什麼」
- **使用 JSDoc**：為公開 API 撰寫 JSDoc 註解
- **TODO 註解**：標記待辦事項，包含負責人和日期

```typescript
/**
 * 建立遊戲房間並返回房間資訊
 * @param config - 房間配置
 * @returns 新建立的房間資訊
 */
async function createRoom(config: RoomConfig): Promise<Room> {
  // TODO: 加入房間人數限制檢查 (d9niel, 2025-01-XX)
  // ...
}
```
