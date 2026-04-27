/**
 * 若需在特定路由載入 Zendesk，可改為讀取 import.meta.env.VITE_ZENDESK_KEY
 * 並以 useEffect 動態插入 static.zdassets.com/ekr/snippet.js。
 * 目前不載入任何第三方腳本，避免影響大廳效能與隱私預設。
 */
export function ZendeskLoader() {
  return null
}
