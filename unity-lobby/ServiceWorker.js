const CACHE_NAME = "Rich-Wynoco-0000" + "-Alpha-20260421182659";
const CACHE_CONTENT = [
    "Build/WebGL_Build_Alpha.loader.js",
    "Build/WebGL_Build_Alpha.framework.js.br",
    "Build/WebGL_Build_Alpha.data.br",
    "Build/WebGL_Build_Alpha.wasm.br",
    "TemplateData/style.css"

];

function isCrossOriginToSW(url) {
    return url.origin !== new URL(self.registration.scope).origin;
}

/** 只對大廳 app shell 做快取，不含同源遊戲代理或其他動態路徑，避免 Cache API 爆量。 */
function isAppShellPath(pathname) {
    if (pathname.startsWith("/Build/")) return true;
    if (pathname.startsWith("/TemplateData/")) return true;
    if (pathname === "/" || pathname === "/index.html") return true;
    if (/\/manifest\.json$/i.test(pathname)) return true;
    if (/ServiceWorker(Setup)?\.js$/i.test(pathname)) return true;
    return false;
}

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
// 策略：僅白名單路徑 Cache First；.unity3d 維持版本快取；其餘僅走網路
// .res 不攔截：Unity streaming asset，避免大型檔案佔滿 cache
self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    
    const url = new URL(event.request.url);
    if (url.pathname.endsWith(".res")) return;

    if (isCrossOriginToSW(url)) {
        event.respondWith(fetch(event.request));
        return;
    }

    if (url.pathname.endsWith(".unity3d")) {
        event.respondWith((async function () {
            const cache = await caches.open(CACHE_NAME);

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
        })());
        return;
    }

    if (!isAppShellPath(url.pathname)) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith((async function () {
        const cache = await caches.open(CACHE_NAME);

        let response = await caches.match(event.request);
        console.log(`[SW] Fetching resource (app shell): ${event.request.url}`);
        if (response) { return response; }

        response = await fetch(event.request);
        if (response && response.ok) {
            try {
                await cache.put(event.request, response.clone());
            } catch (e) {
                console.warn("[SW] cache put skipped:", e);
            }
        }
        return response;
    })());
});
