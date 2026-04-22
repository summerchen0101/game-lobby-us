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

## 環境變數（可選）

日後可新增例如 `VITE_ZENDESK_KEY`，於 `ZendeskLoader` 動態注入客服腳本；預設不載入第三方。
