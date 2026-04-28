import { useEffect } from "react";

const SNIPPET_ID = "ze-snippet";

/**
 * 若設定 `VITE_ZENDESK_KEY`，動態載入 Zendesk snippet（見 docs/profile Support）。
 * 未設定時不載入任何第三方腳本。
 */
export function ZendeskLoader() {
  useEffect(() => {
    const key = import.meta.env.VITE_ZENDESK_KEY?.trim();
    if (!key || typeof document === "undefined") return;
    if (document.getElementById(SNIPPET_ID)) return;
    const script = document.createElement("script");
    script.id = SNIPPET_ID;
    script.src = `https://static.zdassets.com/ekr/snippet.js?key=${encodeURIComponent(key)}`;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}
