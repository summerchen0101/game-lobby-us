function serviceWorkerSetup() {
    console.log("[SW] Entry 1: Function started"); // 確保函數有進來

    // 防止重複初始化
    if (window.__swInitialized) {
        console.log("[SW] Already initialized, skipping");
        return window.__swReady;
    }
    window.__swInitialized = true;

    if (!("serviceWorker" in navigator)) {
        console.log("[SW] SW not supported");
        window.__swReady = Promise.resolve();
        return;
    }

    console.log("[SW] Entry 2: Registering...");
    let reloading = false;

    // SW 超時設定（毫秒）
    const SW_TIMEOUT_MS = 20000; // 改為 20 秒，給足夠的時間讓頁面 reload 和遊戲加載

    /** SW controllerchange 後執行一次 reload */
    function applyUpdate() {
        if (reloading) return;
        reloading = true;
        console.log("[SW] New version activated → reloading");
        window.location.reload();
    }

    /** 通知 SW 立即執行 skipWaiting */
    function skipWaiting(worker) {
        try {
            worker.postMessage({ type: "SKIP_WAITING" });
        } catch (err) {
            console.warn("[SW] skipWaiting postMessage failed:", err);
        }
    }

    /** 帶超時保護的 Promise 包裝器：確保 Promise 一定會 resolve */
    function withTimeout(asyncFn, timeoutMs, timeoutReason) {
        return new Promise((resolve) => {
            let settled = false;
            let timeout;

            function safeResolve(reason) {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                console.log("[SW]", reason);
                resolve();
            }

            timeout = setTimeout(() => {
                safeResolve(timeoutReason);
            }, timeoutMs);

            asyncFn(safeResolve);
        });
    }

    // Unity 啟動前必須等此 Promise resolve
    window.__swReady = navigator.serviceWorker.register("ServiceWorker.js")
        .then(function (reg) {
            console.log("[SW] Registered:", reg.scope);

            // controllerchange 統一觸發 reload（由下方各 case 的 skipWaiting 引起）
            navigator.serviceWorker.addEventListener("controllerchange", applyUpdate);

            // ── Case 1：頁面載入時新 SW 已在等待（上次 session 背景下載完成）──────
            // reg.waiting 存在 = 上次會話背景下載完成的新版本 SW，在等待激活
            // 此時 Unity 尚未啟動，立即切換最安全
            if (reg.waiting) {
                console.log("[SW] Case 1: New SW waiting on load → skip immediately");
                skipWaiting(reg.waiting);
                return withTimeout(
                    () => {
                        // Case 1 等待 controllerchange → applyUpdate → reload
                        // 超時保底，避免遊戲永久卡住
                    },
                    SW_TIMEOUT_MS,
                    `Timeout (${SW_TIMEOUT_MS}ms) waiting for controllerchange, proceeding anyway`
                );
            }

            // ── Case 2：無 waiting，主動呼叫 update() 檢查是否有新版本
            // reg.installing 若存在 = 新 SW 正在下載，會觸發 updatefound 事件
            // 若都不存在 = 首次安裝或已是最新版本
            return withTimeout(
                (safeResolve) => {
                    let updateFoundTriggered = false;

                    reg.addEventListener("updatefound", function () {
                        updateFoundTriggered = true;
                        const newWorker = reg.installing;
                        console.log("[SW] Update found, waiting for install...");

                        newWorker.addEventListener("statechange", function () {
                            console.log("[SW] New worker state:", newWorker.state);

                            if (newWorker.state === "installed") {
                                if (navigator.serviceWorker.controller) {
                                    // 有舊版在運行 = 更新情境 → reload，不放行 Unity
                                    console.log("[SW] New version installed → skip & reload");
                                    skipWaiting(newWorker);
                                    // 不 resolve，等 controllerchange → reload
                                } else {
                                    // 無舊版 = 首次安裝 → 直接放行
                                    safeResolve("First install → proceed");
                                }
                            }
                        });
                    });

                    reg.update()
                        .then(function () {
                            // 用 setTimeout (宏任務) 給 updatefound 事件充分時間觸發
                            // Promise.resolve().then() (微任務) 可能導致競態，updatefound 晚於 Promise 執行
                            // setTimeout 確保 updatefound 和 statechange 事件有足夠時間被處理
                            setTimeout(function () {
                                if (updateFoundTriggered) {
                                    console.log("[SW] updatefound triggered, statechange pending");
                                    // ✅ 修復：如果 updatefound 已觸發但 statechange 遲到，仍需 resolve
                                } else {
                                    safeResolve("No update found → proceed immediately");
                                }
                            }, 200);
                        })
                        .catch(function (err) {
                            // update() 失敗（離線等），不阻擋遊戲啟動
                            console.warn("[SW] update() failed, proceeding anyway:", err);
                            safeResolve("update() failed → proceed");
                        });
                },
                SW_TIMEOUT_MS,
                `Case 2 timeout (${SW_TIMEOUT_MS}ms), proceeding anyway`
            );
        })
        .catch(function (err) {
            // SW 註冊失敗，不阻擋遊戲啟動
            console.warn("[SW] Registration failed, proceeding anyway:", err);
        });
}
