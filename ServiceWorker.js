const CACHE_NAME = "Rich-Wynoco-0000" + "-Alpha-20260421182659";
const CACHE_CONTENT = [
    "Build/WebGL_Build_Alpha.loader.js",
    "Build/WebGL_Build_Alpha.framework.js.br",
    "Build/WebGL_Build_Alpha.data.br",
    "Build/WebGL_Build_Alpha.wasm.br",
    "TemplateData/style.css"

];

// ── Install ───────────────────────────────────────────────────────────────────
// 預快取所有資源
// skipWaiting 不在此處呼叫，控制權交給頁面端，確保在 Unity 啟動前完成版本切換
self.addEventListener("install", (event) => {
    console.log("[SW] Install:", CACHE_NAME);
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("[SW] Caching all: app shell and content");
            return cache.addAll(CACHE_CONTENT);
        })
    );
});

// ── Activate ──────────────────────────────────────────────────────────────────
// 清除所有舊版 cache，立即接管所有頁面
self.addEventListener("activate", (event) => {
    console.log("[SW] Activate:", CACHE_NAME);

    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log("[SW] Deleting old cache:", key);
                        return caches.delete(key);
                    })
            ))
            .then(() => self.clients.claim())
    );
});

// ── Message ───────────────────────────────────────────────────────────────────
// 接受頁面端主動發送的 SKIP_WAITING 指令
self.addEventListener("message", (event) => {
    if (event.data?.type === "SKIP_WAITING") {
        console.log("[SW] Received SKIP_WAITING → skipWaiting()");
        self.skipWaiting();
    }
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
// 策略：Cache First，network fallback
// .res 不攔截：Unity streaming asset，避免大型檔案佔滿 cache
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    
    const url = new URL(event.request.url);
    if (url.pathname.endsWith(".res")) return;

    event.respondWith((async function () {
        const cache = await caches.open(CACHE_NAME);

        if (url.pathname.endsWith(".unity3d")) {
            const cachedKey = url.pathname.replace(/^\/[^/]+\//, "");
            const requestVer = url.searchParams.get("v");

            const cached = await cache.match(cachedKey);
            if (cached) {
                const cachedVer = cached.headers.get("x-bundle-version");

                if (cachedVer === requestVer) {
                    console.log(`[SW] AssetBundle version hit, cacheKey: ${cachedKey}, cachedVer: ${requestVer}`);
                    return cached;
                }

                console.log(`[SW] AssetBundle version changed, cacheKey: ${cachedKey}, ver: ${cachedVer} → ${requestVer}, re-fetching...`);
                await cache.delete(cachedKey);
            }

            const response = await fetch(event.request);

            const headers = new Headers(response.headers);
            headers.set("x-bundle-version", requestVer);

            const repackaged = new Response(await response.arrayBuffer(), {
                status: response.status,
                statusText: response.statusText,
                headers,
            });

            console.log(`[SW] AssetBundle version cached, cacheKey: ${cachedKey}, cachedVer: ${requestVer}`);
            cache.put(cachedKey, repackaged.clone());
            return repackaged;
        }

        let response = await caches.match(event.request);
        console.log(`[SW] Fetching resource: ${event.request.url}`);
        if (response) { return response; }

        response = await fetch(event.request);
        console.log(`[SW] Caching new resource: ${event.request.url}`);
        cache.put(event.request, response.clone());
        return response;
    })());
});
