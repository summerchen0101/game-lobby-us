# 遊戲殼層與靜站併存

## 與舊 `ShowGameCenteredFromHtml` 的對等關係

倉庫根目錄 [index.html](../index.html) 在 Unity 載入完成後，由原生 JS 實作 `ShowGameCenteredFromHtml`：以固定 overlay 內的 `iframe` 開子遊戲或金流，或改 `window.open`；金流頁面會設定較寬的 `allow`（含 `payment`）。

Web 大廳（`web`）是獨立 SPA，沒有 Unity 實例，因此**不**呼叫 `SendMessage("WebMessageReceiver", "OnWebViewHide", …)` 或暫停 Unity 主迴圈；在功能上只須對照：

- 內嵌 / 新分頁選擇
- `iframe` 寬高百分比
- 金流與否對應的 `allow` 屬性
- 關閉 overlay 改為 React 關閉邏輯

若日後在「Unity 全螢幕殼內再嵌一層 H5 大廳」之類的混合架構，需自行決定是否補上與 Unity 的訊息橋接。

## 新站（`web/dist`）與舊 WebGL 靜站

- **新主站**：部署內容為 Vite 產生的 `index.html` + `assets/`，不應與舊站共用同一份 [ServiceWorker.js](../ServiceWorker.js)（舊站為快取 `Build/*.br` 等，見 [web/README.md](../web/README.md)）。[ServiceWorker](ServiceWorker.js) 僅服務歷史 WebGL 靜態包，若兩者同網域不同路徑，務必讓兩邊的 SW 作用範圍不互相覆寫，或分子網域。

## 同網域路徑建議

| 內容 | 建議路徑前綴 | 說明 |
| --- | --- | --- |
| H5 大廳 | `/` 或 `/app/` | 新 Vite 建置 |
| 內測舊 WebGL | `/legacy-webgl/` 等 | 保留 `Build/`、`TemplateData/`，`index` 不與大廳搶根路徑則衝突較小 |

反向代理層可將 `location /api` 轉到後端；靜檔則用各自目錄。

## 相關程式位置

- 舊行為參考：`index.html` 內 `ShowGameCenteredFromHtml`。
- 新實作：`web/src/lib/gameShell.ts`、`web/src/components/GameOverlay.tsx`。
