function fullscreenSetup() {

    // ── 1. 守衛：PWA 模式直接返回 ────────────────────────────────────────────
    function isPWA() {
        if (window.navigator.standalone) return true;
        if (window.matchMedia('(display-mode: standalone)').matches) return true;
        if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
        return false;
    }

    if (isPWA()) {
        return;
    }

    // 預留的平台過濾入口（目前停用）
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    //const isChrome = /CriOS/i.test(navigator.userAgent);
    if (!isIOS) {
        return;
    }

    // ── 2. DOM 引用 & 狀態初始化 ──────────────────────────────────────────────
    document.body.style.minHeight = "200vh";

    const overlay = document.getElementById("fsm_overlay");
    const canvas  = document.querySelector('#unity-canvas');
    const vv      = window.visualViewport;

    const state = {
        fsmEnabled:      false,
        startY:          0,
        hasTriggered:    false,
        baselineHeight:  vv ? vv.height : window.innerHeight,
        isToolbarHidden: false,
        isRotating:      false,
        isScrolling:     false,
    };

    // ── 3. 工具函數 ───────────────────────────────────────────────────────────
    function isLandscape() {
        return window.innerWidth > window.innerHeight;
    }

    // overlay active = 攔截觸控（可滑動狀態）；inactive = 穿透給 Unity
    function updateOverlay() {
        if (state.fsmEnabled && isLandscape() && !state.isToolbarHidden) {
            overlay.classList.add("active");
        } else {
            overlay.classList.remove("active");
        }
    }

    // 嘗試觸發 Safari 收起網址列
    function tryHideBar() {
        state.isScrolling = true;
        window.scrollTo(0, 200);
        setTimeout(() => {
            state.isScrolling = false;
            onViewportResize();
            if (!state.isToolbarHidden) {
                state.hasTriggered = false;
            }
        }, 400);
    }

    function onViewportResize() {
        if (state.isRotating || state.isScrolling) return;

        const currentHeight = vv ? vv.height : window.innerHeight;
        const diff = currentHeight - state.baselineHeight;

        if (!state.isToolbarHidden && diff > 10) {
            // 工具列已關閉
            state.isToolbarHidden = true;
            state.baselineHeight  = currentHeight;
            updateOverlay();
        } else if (state.isToolbarHidden && diff < -10) {
            // Viewport 縮小：可能是工具列出現，或虛擬鍵盤開啟
            const activeEl = document.activeElement;
            const isKeyboardOpen = activeEl && (
                activeEl.tagName === 'INPUT'    ||
                activeEl.tagName === 'TEXTAREA' ||
                activeEl.isContentEditable
            );
            if (isKeyboardOpen) {
                // 虛擬鍵盤開啟，僅更新基準高度
                state.baselineHeight = currentHeight;
            } else {
                // 工具列已開啟
                state.isToolbarHidden = false;
                state.baselineHeight  = currentHeight;
                state.hasTriggered = false;  // 重置狀態，允許再次上滑
                updateOverlay();
            }
        } else if (state.isToolbarHidden && diff > 10) {
            // Viewport 增高（虛擬鍵盤關閉），更新基準高度，工具列仍隱藏
            state.baselineHeight = currentHeight;
        }
    }

    // ── 4. 事件監聽注冊 ───────────────────────────────────────────────────────

    // Viewport 尺寸變化（優先用 visualViewport，兼容舊瀏覽器用 window）
    if (vv) {
        vv.addEventListener("resize", onViewportResize);
    } else {
        window.addEventListener("resize", onViewportResize);
    }

    // 轉向時暫停 onViewportResize，待畫面穩定後判斷工具列狀態
    window.addEventListener("orientationchange", () => {
        state.isRotating = true;
        window.scrollTo(0, 0);

        setTimeout(() => {
            const currentHeight = vv ? vv.height : window.innerHeight;

            // 用螢幕長短邊推算當前方向的全螢幕高度（不受 iOS screen.height 是否互換影響）
            const isLandscapeNow = window.innerWidth > window.innerHeight;
            const expectedFullHeight = isLandscapeNow
                ? Math.min(screen.width, screen.height)
                : Math.max(screen.width, screen.height);
            const toolbarVisible = currentHeight < expectedFullHeight * 0.95;

            state.baselineHeight  = currentHeight;
            state.isToolbarHidden = !toolbarVisible;
            state.isRotating      = false;
            updateOverlay();
        }, 500);
    });

    // 觸控事件轉發給 Unity canvas，同時檢測上滑手勢以觸發收起網址列
    overlay.addEventListener("touchstart", (e) => {
        state.startY = e.touches[0].clientY;
        const newEvent = new TouchEvent('touchstart', e);
        canvas.dispatchEvent(newEvent);
    }, { passive: true });

    overlay.addEventListener("touchend", (e) => {
        const newEvent = new TouchEvent('touchend', e);
        canvas.dispatchEvent(newEvent);

        if (state.hasTriggered) return;

        const delta = e.changedTouches[0].clientY - state.startY;
        if (delta < -10) {
            state.hasTriggered = true;
            tryHideBar();
        }
    }, { passive: true });

    // ── 5. 暴露給 Unity 的公開介面 ────────────────────────────────────────────

    // 由 Unity 呼叫以啟用滑動功能（每次呼叫都會重置狀態）
    window.enableFSMHint = function () {
        state.fsmEnabled    = true;
        state.hasTriggered  = false;
        updateOverlay();
    };

    // 由 Unity 呼叫以關閉滑動功能
    window.disableFSMHint = function () {
        state.fsmEnabled    = false;
        state.hasTriggered  = false;
        updateOverlay();
    };
}
