# Web UI 實際使用的 API 說明

本文件依 **目前 `web` 專案程式碼** 整理：大廳、登入/註冊、帳戶、商店相關 UI 會呼叫的介面。  
**不包含** 遊戲內專用流程（房間內、牌桌/機台內的 Gateway `ApiType` 等）；若需完整 proto 列舉，見 [gateway-proto-api.md](./gateway-proto-api.md)。

---

## 1. 總覽

| 通道 | 用途 |
|------|------|
| **REST（JSON + `fetch`）** | 註冊、登入、目前使用者、大廳遊戲列表、忘記密碼；另有「儲值導轉」API 已封裝但尚未在 UI 串接。 |
| **WebSocket + Gateway 二進位** | 連線存活 heartbeat（`PING_PONG`）、可選的大廳遊戲列表（`LOBBY_GET`）。 |
| **Mock 模式** | `VITE_API_USE_MOCK=true` 時不發真實 REST，由 [`web/src/lib/api/mock.ts`](../src/lib/api/mock.ts) 回傳。 |

實作入口：[`apiRequest`](../src/lib/api/client.ts)、[`getApiPaths`](../src/lib/api/paths.ts)、[`useGatewayWs` / `createGatewayWs`](../src/realtime/useGatewayWs.ts)。

---

## 2. REST：路徑與用途

基底 URL 為 **`VITE_API_BASE`**（可為空，僅 mock 本機時）；實際 URL 為 `joinUrl(路徑)`。預設路徑可經 `VITE_API_PATH_*` 覆寫，見 [`paths.ts`](../src/lib/api/paths.ts)。

### 2.1 大廳與認證（目前有 UI 或 Auth 呼叫）

| 方法 | 預設路徑 | 函式 | 呼叫處 / 行為 | 回傳型別（參考） |
|------|----------|------|----------------|------------------|
| `POST` | `/api/auth/register` | `register` → [`auth.ts`](../src/lib/api/auth.ts) | 註冊流程（`AuthProvider`、`RegisterPage` 等） | `AuthResponse`（`accessToken` + `user`） |
| `POST` | `/api/auth/login` | `login` | 登入（`AuthProvider`） | 同上 |
| `GET` | `/api/user/me` | `fetchCurrentUser` | 有 token 時還原使用者、登入/註冊後刷新 | `User` |
| `GET` | `/api/lobby/games` | `fetchGames` → [`games.ts`](../src/lib/api/games.ts) | 已登入的 `LandingPage`：當 **未** 設定 `VITE_USE_WS_LOBBY_GAMES=true` 時用 REST 拉列表；啟用 WS 大廳時改走 `LOBBY_GET`，**不**呼叫本 API。 | `GamesResponse`（`{ items: Game[] }`） |
| `POST` | `/auth/forgot-password` | `requestPasswordReset` → [`passwordReset.ts`](../src/lib/api/passwordReset.ts) | `LoginModal` 忘記密碼 | 無內容成功即可 |

> `Forgot password` 路徑**不在** `getApiPaths()` 內，為固定相對路徑 `/auth/forgot-password`。

**Authorization**：需登入的 `GET` 帶 `Authorization: Bearer <token>`（`apiRequest` 的 `token` 參數）。

**型別定義**：[ `types.ts` ](../src/lib/api/types.ts)（`User`、`Game`、`AuthResponse` 等）。

### 2.2 金流（已封裝、尚未有頁面呼叫）

| 方法 | 預設路徑 | 函式 | 狀態 |
|------|----------|------|------|
| `GET` | `/api/payment/deposit` + query | `fetchDepositUrl` → [`wallet.ts`](../src/lib/api/wallet.ts) | 已實作；全專案目前 **沒有 import**，預留儲值導轉。Query：`returnUrl`（必填）、`channel`、`amount` 可選。回傳 `DepositResponse`（`url` 等）。 |

### 2.3 純本地／Mock、無後端 API

- **兌換頁小字訊息**：[`useRedeemPillMessages`](../src/features/lobby/useRedeemPillMessages.ts) 使用 `mockGetRedeemPillMessages`（僅 mock 延遲回傳字串陣列），**未** 呼叫 REST。

---

## 3. WebSocket Gateway（protobuf `Request` / `Response`）

連線與二進位編解碼：[`gatewayWs.ts`](../src/realtime/gatewayWs.ts)、[`gatewayWire.ts`](../src/realtime/gatewayWire.ts)。`type` 對應 `proto/gateway/gateway.proto` 的 `ApiType`；常數見 [`gatewayApi.ts`](../src/realtime/gatewayApi.ts)。

### 3.1 目前專案會送出的 `type`

| 數值 | 名稱 | 觸發時機 | 說明 |
|------|------|----------|------|
| `0` | `PING_PONG` | 連線成功後，若 `heartbeatIntervalMs > 0`（預設 25s 週期） | 維持連線，**不帶**業務 `data`（空 bytes）。 |
| `11` | `LOBBY_GET` | 見下節 | 大廳遊戲列表；`data` 目前送 **空** `Uint8Array`；成功且 `code === 200` 時用 [`decodeLobbyGetResponseBytes`](../src/realtime/lobbyDecode.ts) 解 `LobbyGetResponse` 再轉成畫面用 `Game[]`。 |

`LOBBY_GET` 僅在 **`onOpen` 內** 且 **`shouldRunLobbyGetOnOpen`** 為真時送出（[`LandingPage.tsx`](../src/features/lobby/LandingPage.tsx)）：

- 開發模式且 **`VITE_DEV_LOBBY_GET` ≠ `"false"`**，或
- **`VITE_USE_WS_LOBBY_GAMES === "true"`** 且已登入（有 `token`）。

另：**Gateway WebSocket 是否啟用** 為 `gatewayWsEnabled`：開發可透過 **`VITE_DEV_GATEWAY_WS`** 等 probe 開，或當 `VITE_USE_WS_LOBBY_GAMES` 且已登入。

### 3.2 專案目前不會從大廳 UI 主動送出的類型

舉凡：入房、錢包、好友、公會、老虎機內、錦標賽遊戲內專用等 `ApiType`，**本 Web 專案皆未使用**。遊戲內邏輯多由另開的 WebGL／iframe／外部 URL 處理，不列入本表。

### 3.3 可能**被動收到**的 `Response.type`（不逐一實作處理）

若伺服器推播，可能出現與 [gateway-proto-api.md](./gateway-proto-api.md) 中 `ApiType` 1000+ 等一致之 `type`；目前大廳 **沒有** 針對各 push 寫專屬處理，多數僅經 `onResponse` 略過或 dev log。

---

## 4. 環境變數與行為速查

| 變數 | 與 API 的關係 |
|------|----------------|
| `VITE_API_BASE` | REST 基底；mock 可留空。 |
| `VITE_API_USE_MOCK` | 為 `true` 時 REST 全走 mock。 |
| `VITE_API_PATH_AUTH_REGISTER` / `LOGIN` / `LOBBY_GAMES` / `USER_ME` / `PAYMENT_DEPOSIT` | 覆寫預設 REST 路徑。 |
| `VITE_WS_URL`、`VITE_WS_DEVICE_ID` | Gateway WebSocket 連線 URL（[`env.ts` `getGatewayWsUrl`](../src/lib/env.ts)）。 |
| `VITE_USE_WS_LOBBY_GAMES` | 為 `true` 且已登入：啟用 WS、並以 `LOBBY_GET` 解出來的列表作為大廳遊戲來源。 |
| `VITE_DEV_GATEWAY_WS` / `VITE_DEV_LOBBY_GET` | 開發用：方便連上 Gateway / 送 `LOBBY_GET` 除錯。 |
| `VITE_CLIENT_VER` | 寫入每則 `RequestBasic.clientVer`。 |

---

## 5. 相關檔案索引

- REST：`lib/api/*`
- WS：`src/realtime/gatewayWs.ts`、`useGatewayWs.ts`
- 大廳遊戲二進位解碼：`lobbyDecode.ts`（對齊 `web/proto/lobby_wire.proto` 與完整 [`proto/megaman/lobby.proto`](../../proto/megaman/lobby.proto) 說明見 [gateway-proto-api.md 第 3 節](./gateway-proto-api.md)）

本表隨產品擴充可能變更；**以實際 `grep` 呼叫處與本檔同步為準。**
