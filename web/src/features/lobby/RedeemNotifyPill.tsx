import { useEffect, useId, useState, type CSSProperties } from "react";

const PILL_CAROUSEL_INTERVAL_MS = 4000;
const PILL_LINE_EM = 1.3;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

type Props = { messages: string[] };

export function RedeemNotifyPill({ messages }: Props) {
  const n = messages.length;
  const reduced = usePrefersReducedMotion();
  const labelId = useId();
  const shouldLoop = n > 1 && !reduced;
  const slides = shouldLoop ? [...messages, messages[0]!] : messages;
  const [index, setIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);

  useEffect(() => {
    if (n === 0 || !shouldLoop) {
      setIndex(0);
      return;
    }
    setIndex(0);
    const id = window.setInterval(() => {
      setIndex((prev) =>
        prev < n - 1 ? prev + 1 : prev === n - 1 ? n : prev
      );
    }, PILL_CAROUSEL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [n, shouldLoop]);

  if (n === 0) return null;

  const baseLabel = "Recent redemptions and prizes";

  const varStyle: CSSProperties = {
    "--redeem-pill-line-h": `${PILL_LINE_EM}em`,
  } as CSSProperties;

  if (n > 1 && reduced) {
    return (
      <>
        <p id={labelId} className="redeem-page__notify-pill-sr">
          {baseLabel}
        </p>
        <div
          className="redeem-page__notify-pill"
          style={varStyle}
          role="presentation"
          aria-labelledby={labelId}
          aria-hidden
        >
          <div className="redeem-page__notify-pill-viewport">
            <p className="redeem-page__notify-pill-line">{messages[0]}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <p id={labelId} className="redeem-page__notify-pill-sr">
        {baseLabel}
      </p>
      <div
        className="redeem-page__notify-pill"
        style={varStyle}
        role="presentation"
        aria-labelledby={labelId}
        aria-hidden
      >
        <div className="redeem-page__notify-pill-viewport">
          <div
            className={
              "redeem-page__notify-pill-track" +
              (noTransition
                ? " redeem-page__notify-pill-track--notrans"
                : "")
            }
            style={{
              transform: `translate3d(0, calc(-${index} * var(--redeem-pill-line-h, 1.3em)), 0)`,
            }}
            onTransitionEnd={(e) => {
              if (e.propertyName !== "transform" || e.target !== e.currentTarget) {
                return;
              }
              if (!shouldLoop) return;
              if (index !== n) return;
              setNoTransition(true);
              setIndex(0);
              requestAnimationFrame(() => {
                requestAnimationFrame(() => setNoTransition(false));
              });
            }}
          >
            {slides.map((text, i) => (
              <p key={i} className="redeem-page__notify-pill-line">
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
