# 文件索引

本目錄說明 Web 大廳（Vite + React，見 [`../web`](../web)）的架構、與舊 Unity 大廳／正式 API 的對照，以及與倉庫根目錄舊 WebGL 靜態站併存時的部署注意事項。

| 文件 | 說明 |
| --- | --- |
| [lobby-architecture.md](lobby-architecture.md) | 產品流程、路由、驗證、遊戲殼層行為。 |
| [api-spec.md](api-spec.md) | 預設 REST 路徑、請求/回應型別、與 Unity 大廳行為對照表（可依後端實際 contract 改）。 |
| [game-shell.md](game-shell.md) | H5 大廳與舊 `ShowGameCenteredFromHtml`、Service Worker 分離與同站佈署。 |

實作細節與指令摘要見 [web/README.md](../web/README.md)；環境變數以 `VITE_` 為前綴，本機可搭配 `VITE_API_USE_MOCK` 在無後端時開發介面。
