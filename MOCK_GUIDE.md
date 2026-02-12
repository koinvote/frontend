# API Mock 系統使用指南

本專案使用 [MSW (Mock Service Worker)](https://mswjs.io/) 來模擬 API 請求，讓你可以在沒有後端 API 的情況下進行前端開發。

## 快速開始

### 1. 啟用 Mock 模式

有兩種方式啟用 mock 模式：

#### 方式一：使用 npm script（推薦）

```bash
npm run dev:mock
```

這會自動載入 `.env.mock` 配置檔並啟用 mock 模式。

#### 方式二：修改環境變數

在 `.env.development` 檔案中設置：

```bash
VITE_USE_MOCK=true
```

然後正常啟動開發伺服器：

```bash
npm run dev
```

### 2. 驗證 Mock 已啟用

當 mock 模式啟用時，打開瀏覽器控制台，你會看到：

```
[MSW] Mocking enabled - using fake data
```

## Mock 資料結構

所有 mock 資料定義在 `src/mocks/data.ts` 中，包含：

- **系統配置** (`mockSystemConfig`)
- **活動列表** (`mockEventList`) - 包含 4 個範例活動
- **活動詳情** (`mockEventDetail`)
- **熱門標籤** (`mockHotHashtags`)
- **存款狀態** (`mockDepositStatus`)
- **回覆列表** (`mockReplies`)
- **管理員系統參數** (`mockAdminSystemParameters`)

## 已支援的 API 端點

### 公開 API

- ✅ `GET /system/parameters` - 取得系統配置
- ✅ `GET /events` - 取得活動列表（支援篩選、搜尋、分頁）
- ✅ `GET /events/:eventId` - 取得活動詳情
- ✅ `POST /events` - 建立新活動
- ✅ `GET /events/:eventId/signature-plaintext` - 取得簽名明文
- ✅ `POST /events/:eventId/verify-signature` - 驗證簽名
- ✅ `GET /events/:eventId/deposit-status` - 取得存款狀態
- ✅ `GET /events/:eventId/replies` - 取得回覆列表（支援搜尋、排序、分頁）
- ✅ `POST /replies/generate-plaintext` - 取得回覆明文
- ✅ `POST /replies` - 送出回覆
- ✅ `GET /hot-hashtags` - 取得熱門標籤
- ✅ `GET /events/:eventId/payout-report` - 取得派獎報告
- ✅ `GET /events/:eventId/verification-csv` - 下載驗證 CSV 檔案

### 管理員 API

- ✅ `POST /admin/login` - 管理員登入
- ✅ `GET /admin/system-parameters` - 取得系統參數
- ✅ `PUT /admin/system-parameters` - 更新系統參數

## 自訂 Mock 資料

### 修改現有資料

編輯 `src/mocks/data.ts` 來修改 mock 資料：

```typescript
// 例如：新增更多活動到列表
export const mockEventList: EventListDataRes[] = [
  // ... 現有活動
  {
    id: 5,
    event_type: "open-ended",
    event_id: "evt_005_mock",
    title: "你的新活動標題",
    description: "活動描述",
    status: 3,
    // ... 其他欄位
  },
];
```

### 修改 API 行為

編輯 `src/mocks/handlers.ts` 來自訂 API 回應：

```typescript
// 例如：讓 API 回傳錯誤
http.get(`${API_BASE_URL}/events/:eventId`, ({ params }) => {
  return HttpResponse.json({
    code: "404",
    success: false,
    message: "Event not found",
    data: null,
  }, { status: 404 });
}),
```

### 模擬 API 延遲

在 handler 中加入延遲來測試載入狀態：

```typescript
http.get(`${API_BASE_URL}/events`, async () => {
  // 模擬 2 秒延遲
  await new Promise(resolve => setTimeout(resolve, 2000));

  return HttpResponse.json({
    code: "200",
    success: true,
    data: mockGetEventListResponse,
  });
}),
```

## 測試場景範例

### 1. 測試活動列表篩選

```typescript
// Mock 資料已支援以下篩選參數：
// - tab: 'preheat' | 'ongoing' | 'completed'
// - q: 搜尋關鍵字
// - tag: 標籤篩選
// - page: 頁碼
// - limit: 每頁數量
```

訪問：`http://localhost:5173/?tab=ongoing&q=bitcoin`

### 2. 測試活動詳情頁

使用 mock 活動 ID：

- `evt_001_mock` - Open-ended 活動（進行中）
- `evt_002_mock` - Single-choice 活動（預熱中）
- `evt_003_mock` - Open-ended 活動（已完成）
- `evt_004_mock` - Single-choice 活動（進行中）

訪問：`http://localhost:5173/event/evt_001_mock`

### 3. 測試管理員登入

管理員登入 mock 會接受任何簽名並返回 token。

### 4. 測試錯誤狀態

你可以修改 handlers 來模擬錯誤：

```typescript
// 模擬網路錯誤
http.get(`${API_BASE_URL}/events`, () => {
  return HttpResponse.error();
}),

// 模擬 401 未授權
http.get(`${API_BASE_URL}/admin/system-parameters`, () => {
  return HttpResponse.json({
    code: "401",
    success: false,
    message: "Unauthorized",
    data: null,
  }, { status: 401 });
}),
```

## 切換回真實 API

### 方式一：使用正常的 dev script

```bash
npm run dev
```

預設會使用真實 API（`.env.development` 中 `VITE_USE_MOCK=false`）。

### 方式二：修改環境變數

將 `.env.development` 中的設定改為：

```bash
VITE_USE_MOCK=false
```

## 檔案結構

```
src/mocks/
├── browser.ts    # MSW 瀏覽器設定
├── data.ts       # Mock 資料定義
└── handlers.ts   # API 請求處理器

public/
└── mockServiceWorker.js  # MSW Service Worker（自動生成）
```

## 常見問題

### Q: 為什麼看不到 mock 資料？

A: 檢查以下項目：

1. 確認瀏覽器控制台有顯示 `[MSW] Mocking enabled`
2. 確認 `.env.mock` 或 `.env.development` 中 `VITE_USE_MOCK=true`
3. 重新啟動開發伺服器

### Q: 可以在生產環境使用 mock 嗎？

A: 不建議。Mock 系統只會在開發模式下啟用（`import.meta.env.VITE_USE_MOCK === 'true'`）。生產 build 不會包含 MSW 相關程式碼。

### Q: 如何新增更多 mock API？

A: 在 `src/mocks/handlers.ts` 中新增 handler：

```typescript
export const handlers = [
  // ... 現有 handlers

  http.get(`${API_BASE_URL}/your-new-endpoint`, () => {
    return HttpResponse.json({
      code: "200",
      success: true,
      data: {
        /* your mock data */
      },
    });
  }),
];
```

### Q: Mock 會影響測試嗎？

A: 不會。MSW 設計上可以同時用於開發和測試環境，只需在測試設定中啟用即可。

## 進階功能

### 動態回應

根據請求參數動態產生回應：

```typescript
http.get(`${API_BASE_URL}/events/:eventId`, ({ params, request }) => {
  const { eventId } = params;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  // 根據參數客製化回應
  return HttpResponse.json({
    code: "200",
    success: true,
    data: {
      event_id: eventId,
      user_specific_data: userId ? `Data for ${userId}` : null,
    },
  });
}),
```

### 記錄請求

在 handlers 中加入 console.log 來除錯：

```typescript
http.post(`${API_BASE_URL}/events`, async ({ request }) => {
  const body = await request.json();
  console.log('[Mock] Creating event:', body);

  // ... 回應邏輯
}),
```

## 相關資源

- [MSW 官方文件](https://mswjs.io/docs/)
- [MSW 範例](https://github.com/mswjs/examples)
- [React Query 搭配 MSW](https://tanstack.com/query/latest/docs/framework/react/guides/testing#testing-with-mock-service-worker)

## 支援

如有問題或需要新增更多 mock 資料，請查看：

- `src/api/request.ts` - 請求型別定義
- `src/api/response.ts` - 回應型別定義
- `src/mocks/handlers.ts` - API handlers
