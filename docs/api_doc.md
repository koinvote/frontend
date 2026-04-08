# Koinvote API Documentation

## Base URLs

- **DEV**: `http://35.229.204.234:8080`
- **Local Development**: `http://localhost:8080`

All API endpoints should be prefixed with the base URL.

---

# System APIs

## Get System Parameters

**GET** `/api/v1/system/parameters`

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": "System parameters retrieved successfully",
  "data": {
    "min_reward_amount_satoshi": 50000,
    "satoshi_per_extra_winner": 50000,
    "satoshi_per_duration_hour": 50000,
    "dust_threshold_satoshi": 10000,
    "free_hours": 24,
    "platform_fee_percentage": 2,
    "refund_service_fee_percentage": 0,
    "payout_fee_multiplier": 1.0,
    "refund_fee_multiplier": 1.0,
    "withdrawal_fee_multiplier": 1.0,
    "maintenance_mode": false,
    "required_confirmations": 3
  }
}
```

---

# Event Management APIs

## Create Event

**POST** `/api/v1/events`

### Request Body

#### Single Choice Event with Reward

```json
{
  "title": "測試單選題 - 3個中獎者(3小時)",
  "description": "高獎勵測試：150000 sats，3個中獎者，3小時期限",
  "event_type": "single_choice",
  "event_reward_type": "rewarded",
  "initial_reward_satoshi": 150000,
  "duration_hours": 3,
  "creator_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "options": ["支持", "反對", "中立"],
  "hashtags": ["btc", "defi"]
}
```

#### Open-ended Event with Reward

```json
{
  "title": "測試開放式問題 - 長時間有獎勵",
  "description": "長時間活動測試：1200000 sats，24個中獎者，24小時期限",
  "event_type": "open",
  "event_reward_type": "rewarded",
  "initial_reward_satoshi": 1200000,
  "duration_hours": 24,
  "creator_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "hashtags": ["btc", "defi"]
}
```

#### Open-ended Event without Reward

```json
{
  "title": "測試開放式問題 - 無獎勵",
  "description": "純意見收集活動，無獎勵，可以設定任意時長",
  "event_type": "open",
  "event_reward_type": "non_reward",
  "initial_reward_satoshi": 0,
  "duration_hours": 168,
  "creator_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "hashtags": ["btc", "defi"]
}
```

#### Result Visibility Fields (Optional)

```json
{
  "creator_email": "creator@example.com",
  "result_visibility": "public",
  "unlock_price_satoshi": 0
}
```

**Rules:**

- `result_visibility`: `public` | `paid_only` | `creator_only` (default: `public`)
- `paid_only`: `creator_email` required, `unlock_price_satoshi > 0` (unit: satoshi)
- `creator_only`: `creator_email` required, `unlock_price_satoshi = 0`
- `public`: `unlock_price_satoshi = 0`

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KBFB9M9XYD0M6STK1T4ZPWSS",
    "title": "測試單選題 - 3個中獎者(3小時)",
    "description": "高獎勵測試：150000 sats，3個中獎者，3小時期限",
    "event_type": "single_choice",
    "event_reward_type": "rewarded",
    "result_visibility": "public",
    "unlock_price_satoshi": 0,
    "unlock_count": 0,
    "initial_reward_satoshi": 150000,
    "total_reward_satoshi": 150000,
    "winner_count": 3,
    "duration_hours": 3,
    "status": 1,
    "creator_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "deposit_address": "bc1qf35u6njdw57v3hyy5k2e8ss6z6qz7suj5tjnxx2gwzh0r0u6zrnq0dcd3n",
    "deadline_at": "2025-12-02T13:56:23.363274533Z",
    "created_at": "2025-12-02T10:56:23.363274533Z",
    "hashtags": ["btc", "defi"],
    "preheat_hours": 0,
    "preheat_fee_satoshi": 0,
    "total_cost_satoshi": 150000
  }
}
```

**Note**: 事件狀態：1=pending, 2=preheat, 3=active, 4=ended, 5=completed, 6=cancelled, 7=refunded, 8=expired

hashtag一次最多傳入三個標籤，每個標籤長度限制20字元內

---

## Get Edit Event Plaintext

**POST** `/api/v1/events/{event-id}/edit-plaintext`

取得編輯事件用的明文字串，供創建者簽名後傳入 `PUT /api/v1/events/{event-id}`。
明文包含欲更改內容的 SHA256 hash，確保簽名與實際送出的內容一致。

**限制：** 僅限 `preheat`（狀態 2）的事件可呼叫。

### Request Body

傳入與 Edit Event 相同的欲修改內容：

```json
{
  "title": "更新後的標題",
  "description": "更新後的描述",
  "event_type": "single_choice",
  "options": ["選項 A", "選項 B", "選項 C"],
  "hashtags": ["btc", "defi"]
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KXXXXXXX",
    "plaintext": "koinvote.com | edit | event_id:01KXXXXXXX | SHA256(a3f1c2d4e5b6...) | ts:1731000000 | nonce:abcd1234efgh",
    "timestamp": 1731000000
  }
}
```

**Plaintext 格式：**

```
koinvote.com | edit | event_id:{event_id} | SHA256({payload_hash}) | ts:{timestamp} | nonce:{nonce}
```

`payload_hash` 為以下 canonical string 的 SHA256 hex：

```
{title}|{description}|{event_type}|{option1},{option2},...|{hashtag1},{hashtag2},...
```

**Notes:**

- Plaintext TTL 為 15 分鐘，逾時需重新取得。
- 每次呼叫都會產生新的 plaintext，舊的會失效。
- Edit Event 送出的內容必須與此處傳入的完全一致，否則 hash 不符會被拒絕。

---

## Edit Event

**PUT** `/api/v1/events/{event-id}`

編輯預熱狀態的事件。只有 `preheat`（狀態 2）的事件可以編輯。

**可編輯欄位：** `title`、`description`、`event_type`、`options`、`hashtags`

**驗證流程：**

1. 呼叫 `GET /api/v1/events/{event-id}/edit-plaintext` 取得 plaintext
2. 使用 `creator_address` 對應的 Bitcoin 私鑰對 plaintext 進行簽名
3. 將 plaintext 與 signature 一起傳入此 API

### Request Body

```json
{
  "title": "更新後的標題",
  "description": "更新後的描述",
  "event_type": "single_choice",
  "options": ["選項 A", "選項 B", "選項 C"],
  "hashtags": ["btc", "defi"],
  "plaintext": "koinvote.com | edit | event_id:01KXXXXXXX | SHA256(a3f1c2d4e5b6...) | ts:1731000000 | nonce:abcd1234efgh",
  "signature": "Hx..."
}
```

**Validation Rules（與 Create Event 相同）：**

- `title`: required, 1–500 字元
- `description`: optional, max 65535 字元
- `event_type`: `open` 或 `single_choice`
- `options`（`single_choice` 時）: 1–10 個，每個 max 500 字元，不可為空
- `options`（`open` 時）: 不可傳入 options
- `hashtags`: optional，最多 3 個，每個 max 20 字元
- `event_type` 為非 `public` 可見性的事件，不允許改為 `open`
- `plaintext`: required，需與 `edit-plaintext` 回傳值一致（15 分鐘內有效）
- `signature`: required，使用 `creator_address` 對 plaintext 的 Bitcoin 簽名

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KXXXXXXX",
    "title": "更新後的標題",
    "description": "更新後的描述",
    "event_type": "single_choice",
    "options": [
      {
        "id": 10,
        "option_text": "選項 A",
        "order": 1,
        "total_stake_satoshi": 0,
        "weight_percent": 0
      },
      {
        "id": 11,
        "option_text": "選項 B",
        "order": 2,
        "total_stake_satoshi": 0,
        "weight_percent": 0
      },
      {
        "id": 12,
        "option_text": "選項 C",
        "order": 3,
        "total_stake_satoshi": 0,
        "weight_percent": 0
      }
    ],
    "hashtags": ["btc", "defi"],
    "updated_at": "2026-03-19T10:00:00Z"
  }
}
```

### Error Cases

```json
{
  "code": "400000",
  "success": false,
  "message": "event can only be edited when in preheat status"
}
```

```json
{
  "code": "400000",
  "success": false,
  "message": "plaintext time out"
}
```

```json
{
  "code": "400000",
  "success": false,
  "message": "Invalid signature"
}
```

**Notes:**

- Options 會完整替換（舊的全刪，再建立新的）。
- Hashtags 會完整替換。
- Plaintext 使用後即失效，不可重複使用。

---

## Get Signature Plaintext (For Free Event)

**GET** `/api/v1/events/{event-id}/signature-plaintext`

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KCE6NVSDVK9Y5WF3MZ9V45EC",
    "plaintext": "koinvote.com|01KCE6NVSDVK9Y5WF3MZ9V45EC|1765708405|01KCE6R6SJF1H7YH",
    "timestamp": 1765708405
  }
}
```

---

## Verify Signature (For Free Event)

**POST** `/api/v1/events/{event-id}/verify-signature`

### Request Body

```json
{
  "signature": "HxCNhWJZ5Xn3ZG7gKf6KqGxZK2K3mK4qL5mN6pQ7rS8tU9vW0xY1z"
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KCE6NVSDVK9Y5WF3MZ9V45EC",
    "message": "Event successfully activated",
    "status": "activated"
  }
}
```

---

## List Events (Homepage)

**GET** `/api/v1/events`

### Query Parameters

```json
{
  "tab": "ongoing",
  "q": "",
  "tag": "btc",
  "event_reward_type": ["rewarded"],
  "event_type": ["single_choice", "open"],
  "result_visibility": ["public", "paid_only", "creator_only"],
  "page": "1",
  "limit": "20",
  "sortBy": "time",
  "order": "desc"
}
```

**Parameters Description:**

- `tab`: preheat / ongoing / completed (篩選事件狀態分頁)
- `q`: search keyword (title/description)
- `tag`: filter by hashtag (篩選特定標籤的事件)
- `event_reward_type`: rewarded / non_reward，可多選，不傳則包含全部
- `event_type`: single_choice / open，可多選，不傳則包含全部
- `result_visibility`: public / paid_only / creator_only，可多選，不傳則包含全部
- `page`: 1
- `limit`: 20 (max: 50)
- `sortBy`: time / reward / participation
- `order`: desc / asc

**Query String Examples:**

```
# 只看有獎勵的事件
GET /api/v1/events?event_reward_type=rewarded

# 只看單選題
GET /api/v1/events?event_type=single_choice

# 多選（同時包含兩種）
GET /api/v1/events?event_reward_type=rewarded&event_reward_type=non_reward

# 只看付費解鎖的事件
GET /api/v1/events?result_visibility=paid_only

# 組合篩選
GET /api/v1/events?event_reward_type=rewarded&event_type=open&result_visibility=paid_only&tab=ongoing
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "events": [
      {
        "id": 1,
        "event_id": "01KBWGRYTAJHTHHXHPRGENYJMG",
        "title": "免費事件 - 開放式問題",
        "description": "免費事件測試：無獎勵、無預熱、在免費時數內（預設24小時內）",
        "event_type": "single_choice",
        "event_reward_type": "non_reward",
        "status": 3,
        "hashtags": ["education", "learning"],
        "created_at": "2025-12-07T13:42:16.138347Z",
        "preheat_start_at": "2025-12-07T10:42:16.138347Z",
        "started_at": "2025-12-07T13:42:16.155743Z",
        "deadline_at": "2025-12-08T01:42:16.155743Z",
        "ended_at": "2025-12-08T02:00:00.000000Z",
        "updated_at": "2025-12-07T13:45:00.000000Z",
        "total_reward_satoshi": 0,
        "participants_count": 0,
        "total_stake_satoshi": 0,
        "top_replies": [
          {
            "id": 1941,
            "body": "Long-term sustainability should be our priority.",
            "weight_percent": 43,
            "amount_satoshi": 2941
          },
          {
            "id": 1958,
            "body": "Market analysis suggests this could be a game-changer.",
            "weight_percent": 24,
            "amount_satoshi": 2958
          }
        ],
        "options": [
          {
            "id": 1,
            "option_text": "Option A",
            "order": 1,
            "total_stake_satoshi": 120000,
            "weight_percent": 60.0
          },
          {
            "id": 2,
            "option_text": "Option B",
            "order": 2,
            "total_stake_satoshi": 80000,
            "weight_percent": 40.0
          }
        ]
      }
    ],
    "page": 1,
    "limit": 20
  }
}
```

**Note**: 事件狀態：1=pending, 2=preheat, 3=active, 4=ended(已結束，等待派獎), 5=completed(已結束，派獎完成), 6=cancelled, 7=refunded, 8=expired

**結果可見性說明（result_visibility）：**

- 當 `result_visibility` 為 `paid_only` 或 `creator_only` 時，`top_replies[*].weight_percent`、`top_replies[*].amount_satoshi`、`options[*].total_stake_satoshi`、`options[*].weight_percent` 一律回傳 `0`。

---

## Get Event Detail

**GET** `/api/v1/events/{event-id}`

**Note**: 此 API 僅返回狀態非 `pending` 的事件，pending 狀態的事件不對前端用戶開放。

### Query Parameters

| Parameter    | Type   | Required | Description                                                                                                                                                            |
| ------------ | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| unlock_email | string | No       | 用於解鎖受限結果。當 `result_visibility` 為 `paid_only` 或 `creator_only` 時傳入，驗證通過才會回傳真實的 `weight_percent` / `amount_satoshi` / `total_stake_satoshi`。 |

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "id": 1,
    "event_id": "01KBWGRYTAJHTHHXHPRGENYJMG",
    "title": "免費事件 - 開放式問題",
    "description": "免費事件測試：無獎勵、無預熱、在免費時數內（預設24小時內）",
    "event_type": "single_choice",
    "event_reward_type": "non_reward",
    "result_visibility": "public",
    "unlock_price_satoshi": 0,
    "unlock_count": 0,
    "last_unlock_confirmed_at": null,
    "status": 3,
    "initial_reward_satoshi": 0,
    "additional_reward_satoshi": 0,
    "total_reward_satoshi": 0,
    "winner_count": 0,
    "additional_winner_count": 0,
    "duration_hours": 12,
    "creator_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "created_at": "2025-12-07T13:42:16.138347Z",
    "started_at": "2025-12-07T13:42:16.155743Z",
    "deadline_at": "2025-12-08T01:42:16.155743Z",
    "participants_count": 0,
    "total_stake_satoshi": 0,
    "options": [
      {
        "id": 1,
        "option_text": "支持",
        "order": 1,
        "total_stake_satoshi": 120000,
        "weight_percent": 60.0
      },
      {
        "id": 2,
        "option_text": "反對",
        "order": 2,
        "total_stake_satoshi": 80000,
        "weight_percent": 40.0
      }
    ],
    "top_replies": [
      {
        "id": 1748,
        "body": "The governance model needs some refinement.",
        "weight_percent": 30,
        "amount_satoshi": 2748
      },
      {
        "id": 1799,
        "body": "The user experience improvements are substantial.",
        "weight_percent": 45,
        "amount_satoshi": 2799
      }
    ],
    "hashtags": ["education", "learning"],
    "preheat_hours": 0,
    "preheat_start_at": null
  }
}
```

**Notes:**

- `additional_reward_satoshi` and `additional_winner_count` include only confirmed additional rewards.
- `last_unlock_confirmed_at`: 最後一次付費解鎖的確認時間（僅 `paid_only` 活動有值）。前端可用此欄位判斷是否在 24 小時鎖定期內，鎖定期內不允許變更價格/可見性。
- 當 `result_visibility` 為 `paid_only` 或 `creator_only` 且 `unlock_email` 未通過驗證時，`options[*].total_stake_satoshi`、`options[*].weight_percent`、`top_replies[*].amount_satoshi`、`top_replies[*].weight_percent` 一律回傳 `0`。

---

## Get Top Replies (Completed Tab)

**GET** `/api/v1/events/{event-id}/completed/top-replies`

### Query Parameters

| Parameter    | Type   | Required | Description                                                                                                                                    |
| ------------ | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| balance_type | string | No       | current / snapshot (default: snapshot)                                                                                                         |
| unlock_email | string | No       | 用於解鎖受限結果。當 `result_visibility` 為 `paid_only` 或 `creator_only` 時傳入，驗證通過才會回傳真實的 `weight_percent` / `amount_satoshi`。 |

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KBWGRYTAJHTHHXHPRGENYJMG",
    "balance_type": "snapshot",
    "top_replies": [
      {
        "id": 1748,
        "body": "The governance model needs some refinement.",
        "weight_percent": 30,
        "amount_satoshi": 2748
      },
      {
        "id": 1799,
        "body": "The user experience improvements are substantial.",
        "weight_percent": 45,
        "amount_satoshi": 2799
      }
    ]
  }
}
```

**Notes:**

- For open events, top replies are calculated by the selected balance field.
- For single_choice events, top options are calculated by aggregating reply balances per option.
- For single_choice events, this API returns all options, sorted by amount descending; ties are ordered by option order ascending.
- 當 `result_visibility` 為 `paid_only` 或 `creator_only` 且 `unlock_email` 未通過驗證時，`top_replies[*].amount_satoshi` 與 `top_replies[*].weight_percent` 一律回傳 `0`。

---

# Reply Management APIs

## Generate Reply Plaintext

**POST** `/api/v1/replies/generate-plaintext`

### Request Body

#### For Single Choice Event

```json
{
  "event_id": "EVT_20241203_ABC123",
  "btc_address": "tb1q...",
  "option_id": 1
}
```

#### For Open-ended Event

```json
{
  "event_id": "EVT_20241203_ABC123",
  "btc_address": "tb1q...",
  "content": "My opinion about this topic"
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": "Plaintext generated successfully",
  "data": {
    "plaintext": "koinvote.com | type:single | SHA256(Option A) | EVT_20241203_ABC123 | 1701612345 | 123456",
    "nonce_timestamp": "1701612345",
    "random_code": "123456"
  }
}
```

### Error Response

```json
{
  "code": "400000",
  "success": false,
  "message": "Event not found"
}
```

**Notes:**

- Plaintext is stored in Redis for 15 minutes
- Each generate request invalidates previous plaintext for the same address

---

## Submit Reply

**POST** `/api/v1/replies`

### Request Body

#### For Single Choice Event

```json
{
  "event_id": "EVT_20241203_ABC123",
  "btc_address": "tb1q...",
  "option_id": 1,
  "plaintext": "koinvote.com | type:single | SHA256(Option A) | EVT_20241203_ABC123 | 1701612345 | 123456",
  "signature": "H1234567890abcdef...",
  "nonce_timestamp": "1701612345",
  "random_code": "123456",
  "referral_code": "WELCOME2024"
}
```

#### For Open-ended Event

```json
{
  "event_id": "EVT_20241203_ABC123",
  "btc_address": "tb1q...",
  "content": "My opinion about this topic",
  "plaintext": "koinvote.com | type:open | SHA256(4d79697... | EVT_20241203_ABC123 | 1701612345 | 123456",
  "signature": "H1234567890abcdef...",
  "nonce_timestamp": "1701612345",
  "random_code": "123456",
  "referral_code": "WELCOME2024"
}
```

**Parameters Description:**

- `referral_code`: 推薦碼 (optional)，若有傳入，必須存在且 `is_active = 1`，否則回傳錯誤

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": "Reply submitted successfully",
  "data": {
    "id": 123,
    "event_id": "EVT_20241203_ABC123",
    "btc_address": "tb1q...",
    "option_id": 1,
    "content": null,
    "content_hash": null,
    "plaintext": "koinvote.com | type:single | SHA256(Option A) | EVT_20241203_ABC123 | 1701612345 | 123456",
    "signature": "H1234567890abcdef...",
    "nonce_timestamp": "1701612345",
    "random_code": "123456",
    "is_reply_valid": true,
    "balance_at_reply_satoshi": 100000,
    "balance_at_snapshot_satoshi": null,
    "balance_at_current_satoshi": null,
    "balance_last_updated_at": null,
    "is_hidden": false,
    "hidden_at": null,
    "hidden_by_admin_id": null,
    "created_at": "2024-12-03T10:15:30Z",
    "created_by_ip": "192.168.1.1",
    "updated_at": "2024-12-03T10:15:30Z"
  }
}
```

### Error Response

```json
{
  "code": "400000",
  "success": false,
  "message": "Daily reply limit exceeded (3 replies per day per address)"
}
```

**Validation Rules:**

- Plaintext must exist in Redis and match submitted value
- Bitcoin signature must be valid
- Address balance must be > 0
- Maximum 3 replies per address per event per day
- Previous replies from same address will be invalidated
- If `referral_code` is provided, it must exist and be active (`is_active = 1`)

---

## Download Reply Receipt

**GET** `/api/v1/replies/{id}/receipt`

### Response

```json
{
  "version": "1.0",
  "receipt_id": "rpt_01KFGXZ3PMACAKBFE67W1EVZFJ",
  "event_id": "01KFFEBMQFJTV3SSKE0PZZM9C6",
  "addr": "bc1pwkt0d3nq8f28008acaq5temmwdd7k0mf5hpv94ez7f2tqh866vzs823f7x",
  "plaintext": "koinvote.com | type:single | SHA256(hamburger) | 01KFFEBMQFJTV3SSKE0PZZM9C6 | 1769021042 | b018923297",
  "user_sig": "II56oF7Tj+kn0NYebyC0rc8xaH5Tq1JiMwgPKnE3jQz3f7c44/TzwxnemDWo8fePcDOR1LpUmLQe2jpF1OEMoKk=",
  "timestamp": "2026-01-21T18:44:43Z",
  "kid": "kvpub_1",
  "server_sig": {
    "alg": "ed25519",
    "sig": "NJ8wSIxqEo1HTzfsPg8T8ifrpWQlusgKXpZjNn5Pv24YCWgg+sBL7B5HPsyuQXD+mfziTCMkaUXKxd4uxVesAQ==",
    "payload": "version=1.0|receipt_id=...|event_id=...|addr=...|plaintext=...|user_sig=...|timestamp=...|kid=..."
  }
}
```

**Notes:**

- Returns the receipt JSON as a downloadable file.
- `server_sig.payload` is the exact string to verify with Ed25519.
- `kid` refers to the public key id from the receipt public keys list.

---

## List Receipt Public Keys

**GET** `/api/v1/receipt/pub-keys`

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": [
    {
      "kid": "kvpub_1",
      "public_key": "BASE64_PUBLIC_KEY",
      "alg": "ed25519",
      "active": true,
      "created_at": "2026-01-31T18:40:00Z"
    }
  ]
}
```

**Notes:**

- This endpoint returns all receipt public keys for verification.
- `kid` is referenced by receipt JSON.

---

## List Event Replies

**GET** `/api/v1/replies?event_id={event_id}`

### Query Parameters

| Parameter    | Type   | Required | Description                                                                       |
| ------------ | ------ | -------- | --------------------------------------------------------------------------------- |
| event_id     | string | Yes      | Event ID to list replies for                                                      |
| unlock_email | string | No       | Required to unlock replies when event visibility is `paid_only` or `creator_only` |
| search       | string | No       | Search by address, content or option                                              |
| sortBy       | string | No       | Sort by: time, balance (default: balance)                                         |
| order        | string | No       | asc or desc (default: desc)                                                       |
| page         | int    | No       | Page number (default: 1)                                                          |
| limit        | int    | No       | Items per page (default: 20, max: 100)                                            |

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": "Replies retrieved successfully",
  "data": {
    "replies": [
      {
        "id": 123,
        "event_id": "EVT_20241203_ABC123",
        "btc_address": "tb1q...",
        "option_id": 1,
        "content": null,
        "content_hash": null,
        "plaintext": "koinvote.com | type:single | SHA256(Option A) | EVT_20241203_ABC123 | 1701612345 | 123456",
        "signature": "H1234567890abcdef...",
        "nonce_timestamp": "1701612345",
        "random_code": "123456",
        "is_reply_valid": true,
        "balance_at_reply_satoshi": 100000,
        "balance_at_snapshot_satoshi": 95000,
        "balance_at_current_satoshi": 98000,
        "balance_last_updated_at": "2024-12-03T11:00:00Z",
        "is_hidden": false,
        "hidden_at": null,
        "hidden_by_admin_id": null,
        "created_at": "2024-12-03T10:15:30Z",
        "created_by_ip": "192.168.1.1",
        "updated_at": "2024-12-03T10:15:30Z"
      }
    ],
    "is_creator": 0,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response

```json
{
  "code": "400000",
  "success": false,
  "message": "event_id is required"
}
```

```json
{
  "code": "403101",
  "success": false,
  "message": "locked",
  "data": {}
}
```

**Notes:**

- Only shows valid and non-hidden replies
- Default sorting is by balance (descending), then by creation time
- Search supports partial matching on BTC address, reply content, and option text
- For `paid_only` / `creator_only`, missing or unauthorized `unlock_email` returns `403101 (locked)`
- Balance fields show different values:
  - `balance_at_reply_satoshi`: Balance when reply was submitted
  - `balance_at_snapshot_satoshi`: Balance at event snapshot time
  - `balance_at_current_satoshi`: Current real-time balance

---

## Create Event Unlock

**POST** `/api/v1/events/{event-id}/unlock`

### Request Body

```json
{
  "email": "buyer@example.com"
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "unlock_id": "unl_01KXXXXXXX",
    "event_id": "01KXXXXXXX",
    "unlock_email": "buyer@example.com",
    "deposit_address": "bc1qcreatoraddress...",
    "expected_amount_satoshi": 50321,
    "received_amount_satoshi": 0,
    "status": "pending",
    "deposit_timeout_at": "2026-03-05T10:30:00Z",
    "is_creator": 0
  }
}
```

### Error Cases

```json
{
  "code": "403102",
  "success": false,
  "message": "unlock not required",
  "data": {}
}
```

```json
{
  "code": "403101",
  "success": false,
  "message": "locked",
  "data": {}
}
```

**Notes:**

- Only `paid_only` and non-creator email will create unlock records.
- `creator_only` never creates unlock records.
- `unlock not required` returns `403102` (e.g. `public`, or `paid_only` with creator email).
- `locked` returns `403101` (e.g. `creator_only` and request email is not creator email).
- Unlock amount is uniquely generated within configured range to avoid collisions in active window.

**Status Values (`data.status`):**

- `pending`: unlock order created, waiting for payment.
- `unconfirmed`: payment detected but confirmations not enough.
- `unlocked`: payment matched and confirmed, email can view replies.
- `expired`: no matched payment within timeout window.
- `failed`: payment amount mismatch / invalid payment / confirmation stage failed.

---

## Get Event Unlock Deposit Status

**GET** `/api/v1/events/unlock/{unlock_id}/deposit-status`

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "unlock_id": "unl_01KXXXXXXX",
    "event_id": "01KXXXXXXX",
    "unlock_email": "buyer@example.com",
    "deposit_address": "bc1qcreatoraddress...",
    "expected_amount_satoshi": 50321,
    "received_amount_satoshi": 50321,
    "status": "unconfirmed",
    "received_txid": "abcd1234...",
    "first_seen_at": "2026-03-05T10:05:00Z",
    "confirmed_at": null,
    "deposit_timeout_at": "2026-03-05T11:00:00Z"
  }
}
```

**Status Values (`data.status`):**

- `pending`: unlock order created, waiting for payment.
- `unconfirmed`: payment detected but confirmations not enough.
- `unlocked`: payment matched and confirmed, email can view replies.
- `expired`: no matched payment within timeout window.
- `failed`: payment amount mismatch / invalid payment / confirmation stage failed.

### Error Response

```json
{
  "code": "404000",
  "success": false,
  "message": "Unlock record not found"
}
```

---

## Extend Event Unlock Deposit Timeout

**GET** `/api/v1/events/unlock/{unlock_id}/deposit-extend`

**Rules:**

- Only `pending` / `unconfirmed` unlock records can be extended.
- Remaining time must be **less than 30 minutes**.
- Extension adds **30 minutes** to current effective timeout.

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "unlock_id": "unl_01KXXXXXXX",
    "event_id": "01KXXXXXXX",
    "unlock_email": "buyer@example.com",
    "deposit_address": "bc1qcreatoraddress...",
    "expected_amount_satoshi": 50321,
    "received_amount_satoshi": 0,
    "status": "pending",
    "deposit_timeout_at": "2026-03-05T11:30:00Z"
  }
}
```

### Error Response

```json
{
  "code": "400000",
  "success": false,
  "message": "remaining time must be less than 30 minutes"
}
```

---

## Generate Result Visibility Plaintext

**POST** `/api/v1/events/{event-id}/result-visibility/generate-plaintext`

### Request Body

```json
{
  "email": "creator@example.com",
  "result_visibility": "paid_only",
  "unlock_price_satoshi": 50000
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KXXXXXXX",
    "plaintext": "koinvote.com | event_id:01KXXXXXXX | action:update_result_visibility | to:paid_only | unlock_price_satoshi:50000 | ts:1731000000 | nonce:abcd1234",
    "timestamp": 1731000000
  }
}
```

**Notes:**

- Plaintext TTL is 15 minutes.
- If the event has paid unlock in the last 24 hours, this API returns `400000`.

---

## Verify Result Visibility Plaintext

**POST** `/api/v1/events/{event-id}/result-visibility/verify-plaintext`

驗證更改結果可見性的明文簽名是否正確，**不會實際更新設定**。可在送出正式更新前，先行確認簽名有效性。

### Request Body

```json
{
  "email": "creator@example.com",
  "plaintext": "koinvote.com | event_id:01KXXXXXXX | action:update_result_visibility | to:paid_only | unlock_price_satoshi:50000 | ts:1731000000 | nonce:abcd1234",
  "signature": "Hx..."
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KXXXXXXX",
    "valid": true
  }
}
```

### Error Cases

```json
{
  "code": "400000",
  "success": false,
  "message": "plaintext time out"
}
```

```json
{
  "code": "400000",
  "success": false,
  "message": "Invalid signature"
}
```

**Notes:**

- Plaintext 需先透過 `generate-plaintext` 取得，且必須在 15 分鐘內使用。
- 僅 creator email 可驗證。

---

## Update Result Visibility

**POST** `/api/v1/events/{event-id}/result-visibility`

### Request Body

```json
{
  "email": "creator@example.com",
  "result_visibility": "paid_only",
  "unlock_price_satoshi": 50000,
  "plaintext": "koinvote.com | event_id:01KXXXXXXX | action:update_result_visibility | to:paid_only | unlock_price_satoshi:50000 | ts:1731000000 | nonce:abcd1234",
  "signature": "Hx..."
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KXXXXXXX",
    "message": "result visibility updated"
  }
}
```

### Error Cases

```json
{
  "code": "400000",
  "success": false,
  "message": "plaintext time out"
}
```

```json
{
  "code": "400000",
  "success": false,
  "message": "Invalid signature"
}
```

---

## Generate Unlock Price Plaintext

**POST** `/api/v1/events/{event-id}/unlock-price/generate-plaintext`

### Request Body

```json
{
  "email": "creator@example.com",
  "unlock_price_satoshi": 70000
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KXXXXXXX",
    "plaintext": "koinvote.com | event_id:01KXXXXXXX | action:update_unlock_price | unlock_price_satoshi:70000 | ts:1731000000 | nonce:abcd1234",
    "timestamp": 1731000000
  }
}
```

**Notes:**

- Only `paid_only` events can change `unlock_price_satoshi`.
- Plaintext TTL is 15 minutes.

---

## Update Unlock Price

**POST** `/api/v1/events/{event-id}/unlock-price`

### Request Body

```json
{
  "email": "creator@example.com",
  "unlock_price_satoshi": 70000,
  "plaintext": "koinvote.com | event_id:01KXXXXXXX | action:update_unlock_price | unlock_price_satoshi:70000 | ts:1731000000 | nonce:abcd1234",
  "signature": "Hx..."
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KXXXXXXX",
    "message": "unlock price updated"
  }
}
```

### Error Cases

```json
{
  "code": "400000",
  "success": false,
  "message": "unlock price can only be changed when result_visibility is paid_only"
}
```

```json
{
  "code": "400000",
  "success": false,
  "message": "changes are locked for 24 hours after the most recent paid unlock"
}
```

---

# Payment & Deposit APIs

## Get Event Deposit Status

**GET** `/api/v1/events/{event-id}/deposit-status`

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KBFB9M9XYD0M6STK1T4ZPWSS",
    "deposit_address": "bc1qf35u6njdw57v3hyy5k2e8ss6z6qz7suj5tjnxx2gwzh0r0u6zrnq0dcd3n",
    "expected_amount_satoshi": 150000,
    "received_amount_satoshi": 150000,
    "status": "received",
    "confirmed_at": "2025-12-16T10:15:00Z",
    "received_txid": "abcd1234567890...",
    "deposit_timeout_at": "2025-12-16T10:30:00Z",
    "first_seen_at": "2025-12-16T10:05:00Z",
    "block_height": 850000,
    "deposit_type": "event_creation"
  }
}
```

**Status Values:**

- `pending`: 等待付款
- `unconfirmed`: 偵測到0確認轉帳，延長45分鐘
- `received`: 已收到足夠付款，事件已啟動
- `expired`: 已過期
- `frozen`: 異常凍結 (如 multi-input/二次入帳)
- `refund_pending`: 等待退款
- `refund_processing`: 退款處理中
- `refund_completed`: 退款完成
- `refund_failed`: 退款失敗
- `donation_pending`: 待捐款歸集
- `donation_processing`: 捐款歸集中
- `donation_completed`: 捐款已歸集
- `donation_failed`: 捐款歸集失敗
- `withdraw_pending`: 待提款歸集
- `withdraw_processing`: 提款歸集中
- `withdraw_completed`: 提款歸集完成
- `withdraw_failed`: 提款歸集失敗
- `payout_completed`: 派獎完成

---

## Extend Event Deposit Timeout

**GET** `/api/v1/events/{event-id}/deposit-extend`

**Rules:**

- Only available after the first 45-minute extension (deposit must be `unconfirmed` and `extend_timeout_at` must exist)
- Remaining time must be **less than 30 minutes**
- Extension adds **30 minutes** to `extend_timeout_at`
- Only applies to `deposit_type=event_creation`

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KBFB9M9XYD0M6STK1T4ZPWSS",
    "deposit_address": "bc1qf35u6njdw57v3hyy5k2e8ss6z6qz7suj5tjnxx2gwzh0r0u6zrnq0dcd3n",
    "expected_amount_satoshi": 150000,
    "received_amount_satoshi": 150000,
    "status": "unconfirmed",
    "confirmed_at": null,
    "received_txid": "abcd1234567890...",
    "deposit_timeout_at": "2025-12-16T11:03:00Z",
    "first_seen_at": "2025-12-16T10:18:00Z",
    "block_height": null,
    "deposit_type": "event_creation"
  }
}
```

### Error Response

```json
{
  "code": "400000",
  "success": false,
  "message": "remaining time must be less than 30 minutes"
}
```

---

## Get Additional Reward Details

**GET** `/api/v1/events/{event-id}/rewards`

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KBFB9M9XYD0M6STK1T4ZPWSS",
    "rewards": [
      {
        "type": "initial",
        "reward_id": "initial",
        "amount_satoshi": 300000,
        "winner_count": 6,
        "created_at": "2025-12-16T10:00:00Z"
      },
      {
        "type": "additional",
        "reward_id": "rwd_01KBFB9M9XYD0M6STK1T4ZPWSS",
        "amount_satoshi": 200000,
        "winner_count": 4,
        "created_at": "2025-12-16T11:00:00Z"
      }
    ]
  }
}
```

**Notes:**

- Only confirmed additional rewards are included.

---

## Create Additional Reward

**POST** `/api/v1/events/{event-id}/additional-rewards`

### Request Body

```json
{
  "amount_satoshi": 200000,
  "winner_count": 4,
  "refund_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": "Additional reward created successfully",
  "data": {
    "reward_id": "rwd_01KBFB9M9XYD0M6STK1T4ZPWSS",
    "event_id": "01KBFB9M9XYD0M6STK1T4ZPWSS",
    "deposit_id": 124,
    "deposit_address": "bc1qg46v7w9x66s890abcdefghijklmnopqrstuvwxyz",
    "amount_satoshi": 200000,
    "winner_count": 4,
    "timeout_at": "2025-12-16T12:00:00Z",
    "created_at": "2025-12-16T11:00:00Z"
  }
}
```

---

# Payout & Report APIs

## Get Payout Report

**GET** `/api/v1/events/{event-id}/payout-report`

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "event_id": "01KBFB9M9XYD0M6STK1T4ZPWSS",
    "event_title": "Bitcoin Price Prediction Q1 2025",
    "snapshot_block_height": 850000,
    "initial_reward_satoshi": 300000,
    "additional_reward_1_satoshi": 200000,
    "additional_reward_2_satoshi": 0,
    "total_reward_pool_satoshi": 500000,
    "reward_details": [
      {
        "reward_type": "initial",
        "plan_id": 456,
        "original_amount_satoshi": 300000,
        "platform_fee_satoshi": 7500,
        "estimated_miner_fee_satoshi": 5000,
        "distributable_satoshi": 287500,
        "winner_count": 6,
        "dust_winner_count": 1,
        "dust_redistribute_amount_satoshi": 1200,
        "payout_txid": "abc123...",
        "csv_sha256": "d4f8e7c2a1b3456789...",
        "winners": [
          {
            "winner_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            "balance_at_snapshot_satoshi": 500000,
            "win_probability_percent": 20.0,
            "is_dust": false,
            "original_reward_satoshi": 57500,
            "final_reward_satoshi": 57500,
            "distributable_rate": 20.0,
            "status": "completed"
          }
        ]
      },
      {
        "reward_type": "additional",
        "plan_id": 457,
        "original_amount_satoshi": 200000,
        "platform_fee_satoshi": 5000,
        "estimated_miner_fee_satoshi": 3500,
        "distributable_satoshi": 191500,
        "winner_count": 4,
        "dust_winner_count": 0,
        "dust_redistribute_amount_satoshi": 0,
        "payout_txid": "def456...",
        "csv_sha256": "d4f8e7c2a1b3456789...",
        "winners": [
          {
            "winner_address": "bc1qabc123...",
            "balance_at_snapshot_satoshi": 800000,
            "win_probability_percent": 32.0,
            "is_dust": false,
            "original_reward_satoshi": 61280,
            "final_reward_satoshi": 61280,
            "distributable_rate": 32.0,
            "status": "completed"
          }
        ]
      }
    ]
  }
}
```

Event 尚未完成抽獎 或 event 不存在

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {}
}
```

**Notes:**

- `winners` 最多回傳 10 筆，依 `final_reward_satoshi` 由大到小排序
- `distributable_rate` / `win_probability_percent` 單位為百分比（%）

**Winner Status Values:**

- `completed`: 已完成派獎
- `processing`: 派獎處理中
- `redistribute`: 低於 dust 門檻，獎金被重分配

---

## Get Verification CSV

**GET** `/api/v1/events/{event-id}/verification-csv`

### Query Parameters

```json
{
  "plan_id": "456"
}
```

**Parameters Description:**

- `plan_id`: 特定派獎計劃ID

### Response Headers

- `Content-Type`: `text/csv`
- `Content-Disposition`: `attachment; filename="payout_verification_01KBFB9M9XYD0M6STK1T4ZPWSS.csv"`
- `X-CSV-SHA256`: CSV 原始內容的 SHA256

### Response Format

Binary Stream (CSV File Content)

### CSV Content Example

```csv
plan_id,deposit_id,event_id,winner_address,balance_satoshi,win_probability,original_reward_satoshi,is_dust,final_reward_satoshi,payout_txid,payout_status,csv_sha256
456,123,01KBFB9M9XYD0M6STK1T4ZPWSS,bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh,500000,0.20,57500,0,57500,abc123...,completed,d4f8e7c2a1b3456789...
456,123,01KBFB9M9XYD0M6STK1T4ZPWSS,bc1qabc456...,300000,0.12,34500,0,34500,abc123...,completed,d4f8e7c2a1b3456789...
```

---

# Utility APIs

## Subscribe

**POST** `/api/v1/subscribe`

### Request Body

```json
{
  "email": "user@example.com"
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null
}
```

### Error Response

```json
{
  "code": "400000",
  "success": false,
  "message": "Invalid email format"
}
```

---

## Unsubscribe

**POST** `/api/v1/unsubscribe`

### Request Body

```json
{
  "token": "eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJleHAiOjE3NzAwMDAwMDB9.xxx"
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "message": "Unsubscribed successfully"
  }
}
```

### Error Response

```json
{
  "code": "400000",
  "success": false,
  "message": "Invalid or expired unsubscribe token"
}
```

**Notes:**

- `token` is generated by backend and embedded in email param `unsubscribe_url`.
- Unsubscribe is idempotent: if email does not exist or already inactive, it still returns success.

---

## Contact Us

**POST** `/api/v1/contact-us`

### Request Body

```json
{
  "email": "user@example.com",
  "subject": "Need help",
  "message": "Please help me with..."
}
```

### Validation Rules

| Field   | Rule                     |
| ------- | ------------------------ |
| email   | required, email format   |
| subject | required, max 150 chars  |
| message | required, max 3000 chars |

### Response (Success)

```json
{
  "code": "000000",
  "success": true,
  "message": null
}
```

### Response (Error)

```json
{
  "code": "400000",
  "success": false,
  "message": "invalid request body: ..."
}
```

---

## Get Hot Hashtags

**GET** `/api/v1/hot-hashtags`

### Query Parameters

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| tab       | string | No       | preheat / ongoing / completed (default: ongoing) |
| limit     | int    | No       | Number of hashtags (default: 10, max: 30)        |

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": ["bitcoin", "bull", "doge", "president", "crypto"]
}
```

---

# Admin APIs

## Admin Authentication

All admin API endpoints (except `/api/v1/admin/login`) require authentication using Bearer token in the Authorization header.

### Header Format

```
Authorization: Bearer <token>
```

### Example

```
Authorization: Bearer abcd1234567890efgh...
```

---

## Admin Login

**POST** `/api/v1/admin/login`

### Request Body

```json
{
  "address": "bc1ql4ugj3t09cw84dulj5y2ulvzftzt3ha9qsy539",
  "plaintext": "koinvote.com|admin_login|1734345600|RAND123",
  "signature": "HzqwHNG+0OANfHVQ768La5WMqv171OWOrYXJRCRcidM7ZijTdqZgm8zCEPrHi7NA27p/G4mbq+EVy7uPbkir8pw="
}
```

**Parameters Description:**

- `address`: Admin's Bitcoin wallet address (must be in admin whitelist)
- `plaintext`: Message to be signed with format "koinvote.com|admin_login|timestamp|random_code"
- `signature`: Bitcoin wallet signature of the plaintext message

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "token": "a1b2c3d4e5f6789012345678901234567890abcdef..."
  }
}
```

### Error Response

```json
{
  "code": "401000",
  "success": false,
  "message": "Invalid signature"
}
```

**Error Cases:**

- Invalid address (not in admin list)
- Invalid signature
- Admin account is inactive

---

## Get Withdrawal Info

**GET** `/api/v1/admin/withdrawals/info`

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "platform_amount_satoshi": 250000,
    "withdrawable_amount_satoshi": 50000,
    "withdraw_address": "bc1qexamplewithdrawaddress",
    "fee_satoshi": 250,
    "hash_key": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}
```

**Notes:**

- `hash_key` 會存入 Redis，TTL 1 小時，每次呼叫都會更新。
- `withdrawable_amount_satoshi` 代表本次歸集可提款的總額。

---

## Create Withdrawal

**POST** `/api/v1/admin/withdrawals`

### Request Body

```json
{
  "admin_address": "bc1qexampleadminaddress",
  "hash_key": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "signature": "H1234567890abcdef..."
}
```

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "id": 12,
    "to_address": "bc1qexamplewithdrawaddress",
    "amount_satoshi": 50000,
    "fee_satoshi": 250,
    "txid": "abc123...",
    "status": "completed"
  }
}
```

**Notes:**

- `hash_key` 須來自 `/api/v1/admin/withdrawals/info` 的回傳值
- `signature` 使用 `admin_address` 對 `hash_key` 進行簽章

---

## Get Withdrawal Record

**GET** `/api/v1/admin/withdrawals`

### Query Parameters

```json
{
  "page": "1",
  "limit": "15",
  "to_address": "bc1ql4ugj3t09cw84dulj5y2ulvzftzt3ha",
  "start_time": "2025-01-01T00:00:00Z",
  "end_time": "2025-01-31T23:59:59Z"
}
```

**Parameters Description:**

- `page`: 頁碼 (default: 1,optional)
- `limit`: 每頁數量 (default: 15, max: 50,optional)
- `to_address`: 篩選特定收款地址 (optional)
- `start_time`: 篩選起始時間 (ISO 8601 format, optional)
- `end_time`: 篩選結束時間 (ISO 8601 format, optional)

**Note:** default sortBy `timestamp` desc

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "withdrawals": [
      {
        "id": 1,
        "from_address": "bc1ql4ugj3t09cw84dvzftzt3ha9qsy539",
        "to_address": "bc1ql4ugj3t09cw84dulj5y2ulvzftzt3ha",
        "txid": "abc123...",
        "amount": 10000,
        "fee": 100,
        "ticket_id": "123",
        "status": "completed",
        "timestamp": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

- Status values:
  - `pending`: waiting for withdrawal broadcast
  - `processing`: broadcasted, waiting for confirmation
  - `completed`: confirmed on-chain
  - `failed`: broadcast failed or confirmation error

---

## Search Subscribers

**GET** `/api/v1/admin/subscribers`

**Authentication Required**: Bearer token in Authorization header

### Query Parameters

```json
{
  "email": "test@example.com",
  "page": "1",
  "limit": "20"
}
```

**Parameters Description:**

- `email`: 搜尋 Email (optional)
- `page`: 頁碼 (default: 1)
- `limit`: 每頁數量 (default: 20, max: 50)

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "subscribers": [
      {
        "email": "test@example.com",
        "updated_at": "2025-01-01T12:00:00Z",
        "subscribed_at": "2025-01-01T12:00:00Z",
        "active": true
      }
    ],
    "page": 1,
    "limit": 20
  }
}
```

---

## Export Subscribers CSV

**GET** `/api/v1/admin/subscribers/export-csv`

**Authentication Required**: Bearer token in Authorization header

### Response Headers

- `Content-Type`: `text/csv`
- `Content-Disposition`: `attachment; filename="subscribers.csv"`

### Response Format

Binary Stream (CSV File Content)

### CSV Content Example

```csv
email,subscribed_at,updated_at,active
user1@example.com,2025-01-01 10:00:00,2025-01-01 10:00:00,true
user2@example.com,2025-01-02 11:30:00,2025-01-02 11:30:00,true
```

---

## Get Admin System Parameters

**GET** `/api/v1/admin/system-parameters`

**Authentication Required**: Bearer token in Authorization header

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "min_reward_amount_satoshi": 50000,
    "satoshi_per_extra_winner": 10000,
    "satoshi_per_duration_hour": 10000,
    "dust_threshold_satoshi": 546,
    "free_hours": 24,
    "platform_fee_percentage": 2.5,
    "refund_service_fee_percentage": 0.5,
    "payout_fee_multiplier": 1.0,
    "refund_fee_multiplier": 1.0,
    "withdrawal_fee_multiplier": 1.0,
    "maintenance_mode": false,
    "required_confirmations": 3
  }
}
```

---

## Update Admin System Parameters

**PUT** `/api/v1/admin/system-parameters`

**Authentication Required**: Bearer token in Authorization header

### Request Body

```json
{
  "min_reward_amount_satoshi": 50000,
  "satoshi_per_extra_winner": 10000,
  "satoshi_per_duration_hour": 10000,
  "dust_threshold_satoshi": 546,
  "free_hours": 24,
  "platform_fee_percentage": 2.5,
  "refund_service_fee_percentage": 0.5,
  "payout_fee_multiplier": 1.0,
  "refund_fee_multiplier": 1.0,
  "withdrawal_fee_multiplier": 1.0,
  "maintenance_mode": false,
  "required_confirmations": 3
}
```

**Parameters Description:**

- `min_reward_sats`: 最低發起獎金金額
- `sats_per_extra_winner`: 中獎地址數 / 金額比例
- `sats_per_duration_hour`: 多少BTC對應1小時
- `min_payout_sats`: 最低派獎門檻
- `free_hours`: 免費時數
- `platform_fee_percent`: 平台手續費百分比
- `refund_service_fee_percentage`: 退款服務費百分比
- `payout_fee_multiplier`: 派獎手續費倍數
- `refund_fee_multiplier`: 退款手續費倍數
- `withdrawal_fee_multiplier`: 提款手續費倍數
- `maintenance_mode`: 維護模式開關
- `required_confirmations`: 所需確認數

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null
}
```

### Error Response

```json
{
  "code": "400000",
  "success": false,
  "message": "Invalid parameters"
}
```

---

## Get Referral Code Count

**GET** `/api/v1/referral-codes/count`

回傳目前 `is_active = 1` 的推薦碼總數量。

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "count": 42
  }
}
```

---

## Validate Referral Code

**GET** `/api/v1/referral-codes/validate?code=xxx`

回傳指定推薦碼是否有效（存在且 `is_active = 1`）。

### Query Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `code`    | string | Yes      | 推薦碼字串  |

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "valid": true
  }
}
```

若推薦碼不存在或已停用，`valid` 回傳 `false`（HTTP status 仍為 200）。

---

# Admin APIs

## Get Referral Codes

**GET** `/api/v1/admin/referral-codes`

**Authentication Required**: Bearer token in Authorization header

只回傳 `is_active = 1` 的推薦碼，支援分頁。

### Query Parameters

| Parameter | Type | Default | Description        |
| --------- | ---- | ------- | ------------------ |
| `page`    | int  | 1       | 頁碼               |
| `limit`   | int  | 20      | 每頁數量 (max: 50) |

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "referral_codes": [
      {
        "id": 1,
        "code": "WELCOME2024",
        "is_active": true,
        "created_at": "2025-01-01T12:00:00Z",
        "updated_at": "2025-01-01T12:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  }
}
```

---

## Create Referral Code

**POST** `/api/v1/admin/referral-codes`

**Authentication Required**: Bearer token in Authorization header

### Request Body

```json
{
  "code": "WELCOME2024"
}
```

**Parameters Description:**

- `code`: 推薦碼字串 (required, max 64 chars)

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": {
    "id": 1,
    "code": "WELCOME2024",
    "is_active": true,
    "created_at": "2025-01-01T12:00:00Z",
    "updated_at": "2025-01-01T12:00:00Z"
  }
}
```

### Error Response

```json
{
  "code": "400000",
  "success": false,
  "message": "Invalid request payload"
}
```

---

## Delete Referral Code

**DELETE** `/api/v1/admin/referral-codes/:id`

**Authentication Required**: Bearer token in Authorization header

軟刪除推薦碼（設 `is_active=0`），不會從資料庫移除。

### Path Parameters

- `id`: 推薦碼 ID

### Response

```json
{
  "code": "000000",
  "success": true,
  "message": null,
  "data": null
}
```

### Error Response

```json
{
  "code": "404000",
  "success": false,
  "message": "Referral code not found or already inactive"
}
```

---

# Additional Notes

## Reply Behavior

- 同一個地址對同一事件提交新回覆時，舊的回覆會自動作廢（`is_reply_valid = false`）
- 不存在更新回覆的功能，只能重新提交新回覆
- 每次提交新回覆都會重新計算餘額和權重
