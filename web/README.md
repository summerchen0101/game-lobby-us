# Wynoco Web 大廳

Vite + React + TypeScript。開發在 `web/`，產線請將 **`dist/` 內容部署為網站根**（`https://<domain>/`），與本倉庫根目錄舊的 Unity WebGL 靜態包分開。

## 指令

| 指令 | 說明 |
| --- | --- |
| `npm install` | 安裝依賴 |
| `npm run dev` | 本機開發，預設 `http://localhost:5173` |
| `npm run build` | 產生 `dist/`（`tsc` + Vite 打包） |
| `npm run preview` | 本機預覽 build 結果 |
| `npm run lint` | ESLint |

`vite.config.ts` 內 `base: '/'`，適合掛在網域根。若臨時要掛在子路徑，改 `base: '/子路徑/'` 後重建。

## 產線與舊靜站

- **新主站**：靜態托管根目錄 = `web/dist` 的檔案（`index.html`、雜湊化 js/css、`assets/`、`manifest.webmanifest` 等）。
- **舊站**：倉庫根的 Unity `ServiceWorker.js` / 舊 `manifest.json` 是為 WebGL 快取設計的，**不要**拿來當此 SPA 的 Service Worker。若之後要 PWA 離線快取，請另建 Vite 相容的生成策略，並避免與舊 SW 衝突。
- **內測舊 WebGL**（若仍需要）：可放在其他子路徑或子網域，勿與新站搶同一路徑的 SW。

## 專案結構（摘要）

- `src/index.css` — 斷點、安全區、`dvh` 等 RWD 基底
- `src/components/AppShell.tsx` — 頂欄、底欄（小螢幕）、主內容
- `src/features/lobby/` — 大廳與佔位頁
- `public/manifest.webmanifest` — 安裝/主畫面捷徑用（圖示可再補 192/512 png）

## 環境變數

見根目錄同層的 [`.env.example`](.env.example)。常用項：

| 變數 | 說明 |
| --- | --- |
| `VITE_API_BASE` | 後端 API 根路徑（不帶尾隨斜線）。未設且非 mock 時，請以反向代理讓同源的 `/api` 可轉到後端。 |
| `VITE_API_USE_MOCK` | 設 `true` 則不發真實 HTTP，用內建假資料。本機有預設 [`.env.development`](.env.development)。 |
| `VITE_OPEN_GAMES_IN_NEW_WINDOW` | 遊戲未指定 `openInNewWindow` 時是否預設新分頁，對應舊殼的 `OPEN_GAMES_IN_NEW_WINDOW_DEFAULT`。 |
| `VITE_API_PATH_AUTH_*` | 可覆寫註冊／登入／refresh token 相對路徑（見 `.env.example`）。 |

`VITE_ZENDESK_KEY` 可日後用於 `ZendeskLoader` 動態注入客服；預設不載入第三方。

架構、API 預設與 Unity 對照見倉庫 [docs/](../docs/)。
