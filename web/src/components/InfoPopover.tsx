import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import "./InfoPopover.css";

const GAP = 8;

export type InfoPopoverTriggerProps = {
  onClick: (e: ReactMouseEvent<HTMLElement>) => void;
  "aria-expanded": boolean;
  "aria-controls": string;
  "aria-haspopup": "dialog";
  type: "button";
};

type InfoPopoverProps = {
  content: ReactNode;
  children: (
    props: InfoPopoverTriggerProps,
    triggerRef: RefObject<HTMLButtonElement | null>,
  ) => ReactNode;
  align?: "start" | "center" | "end";
  panelClassName?: string;
};

export function InfoPopover({
  content,
  children,
  align = "end",
  panelClassName = "",
}: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const updatePosition = useCallback(() => {
    const trig = triggerRef.current;
    const panel = panelRef.current;
    if (!trig || !panel) return;

    const t = trig.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = t.bottom + GAP;
    if (top + p.height > vh - GAP && t.top - GAP - p.height >= GAP) {
      top = t.top - GAP - p.height;
    }

    let left: number;
    if (align === "start") {
      left = t.left;
    } else if (align === "end") {
      left = t.right - p.width;
    } else {
      left = t.left + (t.width - p.width) / 2;
    }

    left = Math.min(Math.max(GAP, left), vw - p.width - GAP);
    top = Math.min(Math.max(GAP, top), vh - p.height - GAP);

    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const id = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(id);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const ro = new ResizeObserver(() => updatePosition());
    ro.observe(panelRef.current);
    return () => ro.disconnect();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  const toggle = useCallback((e: ReactMouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setOpen((v) => !v);
  }, []);

  const triggerProps: InfoPopoverTriggerProps = {
    onClick: toggle,
    "aria-expanded": open,
    "aria-controls": panelId,
    "aria-haspopup": "dialog",
    type: "button",
  };

  return (
    <>
      {children(triggerProps, triggerRef)}
      {open
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="false"
              className={`info-popover ${panelClassName}`.trim()}>
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
