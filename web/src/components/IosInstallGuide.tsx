import { useCallback, useEffect, useState } from "react";
import { MdIosShare } from "react-icons/md";
import { isStandalonePWA } from "../lib/pwaMode";
import "./IosInstallGuide.css";

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
  );
}

const SHOW_DELAY_MS = 10_000;

export function IosInstallGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isIOS() || isStandalonePWA()) return;
    const t = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  if (!open) return null;

  return (
    <div
      className="ios-guide"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}>
      <div className="ios-guide__card">
        <h2 id="ios-guide-title" className="ios-guide__title">
          Add to Home Screen (iOS)
        </h2>
        <img
          className="ios-guide__icon"
          src="/imgs/pwa_icon.png"
          alt=""
          width={80}
          height={80}
          decoding="async"
        />
        <div className="ios-guide__steps">
          <p>
            1. Tap the <b>Share</b> button in the browser bar{" "}
            <span className="ios-guide__share-wrap" aria-hidden="true">
              <MdIosShare className="ios-guide__share" size={20} />
            </span>
            .
          </p>
          <p>
            2. Scroll down and tap <b>Add to Home Screen</b>.
          </p>
        </div>
        <button type="button" className="ios-guide__dismiss" onClick={close}>
          Continue in the browser
        </button>
      </div>
    </div>
  );
}
