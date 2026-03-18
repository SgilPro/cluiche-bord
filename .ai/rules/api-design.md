# API 設計規範

## RESTful API 原則

### HTTP 方法使用
- **GET**：查詢資源，不應有副作用
- **POST**：建立新資源
- **PUT**：完整更新資源（替換所有欄位）
- **PATCH**：部分更新資源（只更新提供的欄位）
- **DELETE**：刪除資源

### URL 設計
- 使用名詞而非動詞
- 使用複數形式（`/api/rooms` 而非 `/api/room`）
- 巢狀資源不超過兩層
- 使用查詢參數過濾和分頁

```
✅ /api/rooms
✅ /api/rooms/[id]
✅ /api/rooms/[id]/players
❌ /api/getRooms
❌ /api/room
```

## 請求/回應格式

### 請求標頭
```typescript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>' // 如需要認證
}
```

### 成功回應
```typescript
// 單一資源
{
  data: {
    id: string,
    // ... 資源資料
  }
}

// 列表資源
{
  data: Array<Resource>,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

### 錯誤回應
```typescript
{
  error: string,        // 錯誤類型（如 'ValidationError', 'NotFound'）
  message: string,      // 使用者友善的錯誤訊息
  details?: unknown    // 詳細錯誤資訊（開發環境）
}
```

### HTTP 狀態碼
- **200 OK**：成功獲取或更新資源
- **201 Created**：成功建立資源
- **400 Bad Request**：請求格式錯誤或驗證失敗
- **401 Unauthorized**：未認證
- **403 Forbidden**：已認證但無權限
- **404 Not Found**：資源不存在
- **500 Internal Server Error**：伺服器錯誤

## 輸入驗證

### 驗證層級
1. **型別驗證**：使用 TypeScript 型別
2. **Schema 驗證**：使用 Zod 或類似的驗證庫（未來）
3. **業務邏輯驗證**：在 API 路由中驗證

### 驗證錯誤回應
```typescript
{
  error: 'ValidationError',
  message: '輸入驗證失敗',
  details: {
    field: 'roomName',
    message: '房間名稱不能為空'
  }
}
```

## API 路由實作範例

```typescript
// src/app/api/rooms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const rooms = await prisma.room.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return NextResponse.json({
      data: rooms,
      pagination: {
        page,
        limit,
        total: await prisma.room.count(),
      }
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      {
        error: 'InternalServerError',
        message: '無法獲取房間列表'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 驗證輸入
    if (!body.name || !body.gameId) {
      return NextResponse.json(
        {
          error: 'ValidationError',
          message: '房間名稱和遊戲 ID 為必填欄位'
        },
        { status: 400 }
      );
    }
    
    const room = await prisma.room.create({
      data: {
        name: body.name,
        gameId: body.gameId,
        // ...
      }
    });
    
    return NextResponse.json({ data: room }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      {
        error: 'InternalServerError',
        message: '無法建立房間'
      },
      { status: 500 }
    );
  }
}
```

## Socket.IO API 設計

### 事件命名
- 使用命名空間和動作：`namespace:action`
- 使用動詞描述動作：`join`, `leave`, `update`, `create`

### 事件格式
```typescript
// 客戶端發送
socket.emit('room:join', {
  roomId: string,
  userId: string
});

// 伺服器回應
socket.on('room:joined', (data: {
  room: Room,
  players: Player[]
}) => {
  // ...
});
```

### 錯誤處理
```typescript
socket.emit('room:join', data, (response: {
  success: boolean,
  error?: string,
  data?: Room
}) => {
  if (!response.success) {
    console.error('Error:', response.error);
  }
});
```

## API 文件

### 文件要求
- 重要 API 必須有文件說明
- 包含請求/回應範例
- 說明錯誤情況和狀態碼

### 文件位置
- API 路由：在檔案頂部使用 JSDoc 註解
- 完整文件：考慮使用 OpenAPI/Swagger（未來）
