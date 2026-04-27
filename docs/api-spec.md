# API 規格（Web 大廳預設介面）

以下為實作時採用的 **預設路徑與欄位**；與你方正式 API 若有差異，請在 [`web`](../web) 內 `src/lib/api/` 與本文件同步更新。Base URL 由環境變數 `VITE_API_BASE` 提供（不帶尾隨斜線）。

## 通則

- 除註冊/登入外，需帶認證標頭：  
  `Authorization: Bearer <accessToken>`
- 回應內容假設為 `application/json`。
- 錯誤：HTTP 4xx/5xx，body 可含 `{ "message": string, "code"?: string }`（客戶端會顯示 `message`）。

## 端點摘要

| 方法 | 路徑 | 說明 |
| --- | --- | --- |
| `POST` | `/api/auth/register` | 註冊 |
| `POST` | `/api/auth/login` | 登入 |
| `GET` | `/api/lobby/games` | 遊戲列表（需登入） |
| `GET` | `/api/user/me` | 當前使用者與錢包餘額（需登入） |
| `GET` | `/api/payment/deposit` | 取得儲值頁 URL（需登入，可帶查詢參數，見下） |

路徑可透過 `VITE_API_PATH_*` 覆寫，見 `web/.env.example`。

### `POST /api/auth/register`

**Request（JSON）**

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `account` | string | 帳號 |
| `password` | string | 密碼 |
| `displayName` | string? | 顯示名稱（可選） |

**Response（JSON）** — 實作可與登入相同，或僅回 `{ "ok": true }` 再導去登入；目前客戶端假設可取得 token：

| 欄位 | 型別 |
| --- | --- |
| `accessToken` | string |
| `tokenType` | string（可選，預設 `Bearer`） |
| `user` | 見下方 `User` |

### `POST /api/auth/login`

**Request（JSON）** — `account`, `password`

**Response（JSON）**

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `accessToken` | string | JWT 或等效 |
| `tokenType` | string? | 預設 `Bearer` |
| `user` | `User` | 可選，缺省則之後以 `/api/user/me` 補齊 |

`User`：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `id` | string | |
| `displayName` | string? | |
| `balance` | number? | 可於 `/me` 再給精確值 |
| `currency` | string? | 例如 TWD |

### `GET /api/lobby/games`

**Response（JSON）**

| 欄位 | 型別 |
| --- | --- |
| `items` | `Game[]`（若後端用 `data` 等包一層，可改 `games.ts` 的解析） |

`Game`：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `id` | string | |
| `title` | string | 顯示名稱 |
| `subtitle` | string? | 副標 |
| `launchUrl` | string | 進入遊戲的完整 URL（必要） |
| `embedWidthPercent` | number? | 內嵌寬，預設 90 |
| `embedHeightPercent` | number? | 內嵌高，預設 90 |
| `openInNewWindow` | boolean? | 若 true 則不內嵌，改新分頁（覆寫大廳預設行為） |

### `GET /api/user/me`

**Response（JSON）** — `User`（`balance` / `currency` 建議在此給出）

### `GET /api/payment/deposit`

可帶查詢：`channel`、`amount` 等，依後端實作；客戶端目前會帶上 `?returnUrl=<encodeURIComponent(目前網址)>` 便於金流導回。

**Response（JSON）**

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `url` | string | 金流/儲值 H5 完整 URL |
| `openInNewWindow` | boolean? | 可選，預設 false（內嵌金流需 `payment` 權限） |

## 與 Unity 大廳對照

| Unity / 產品行為 | Web 大廳實作 | 本文件端點 / 欄位 |
| --- | --- | --- |
| 註冊帳密 | 註冊頁 → `register` | `POST /api/auth/register` |
| 登入 | 登入頁，存 token | `POST /api/auth/login` |
| 顯示遊戲列表 | 大廳 grid | `GET /api/lobby/games` → `items` |
| 進入子遊戲（`ShowGameCenteredFromHtml`） | `GameOverlay` 或新分頁 | 各 `Game.launchUrl` 與尺寸/新分頁欄位 |
| 顯示餘額、暱稱 | Header / 我的 | `GET /api/user/me` |
| 開啟儲值／金流 H5 | 同遊戲殼，但 `isPayment=true` | `GET /api/payment/deposit` 回傳的 `url` |

若 Unity 專案內有額外參數（如 `productId`、租戶 id），建議在後端統一附在 `launchUrl` / `deposit url` 查詢字串，前端維持只接收完整 URL 與顯示模式即可。

## 本機開發

設定 `VITE_API_USE_MOCK=true` 時不發真實請求，內建假資料（見 `web/src/lib/api/mock.ts`），仍會寫入假 token 以便測導向與殼層。正式建置勿啟用。
