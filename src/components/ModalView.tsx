import React, { useCallback, useEffect, useRef, useState } from "react";
import { useModalStore } from "../store/useModalStore";
import type { ModalItem, ModalOptions } from "../types";
import { resolveCollisionsWithOthers } from "../utils/collision";
import type { ScrollSyncInstance } from "../utils/scrollSync";

const DEFAULT_MIN = { width: 200, height: 120 };

export interface ModalViewProps {
  item: ModalItem;
  scrollSyncGroups: Map<string, ScrollSyncInstance>;
  onBackdropClick?: () => void;
  /** 모달 루트에 적용할 className (ModalController의 modalClassName으로도 전달됨) */
  className?: string;
}

export function ModalView({
  item,
  scrollSyncGroups,
  className,
}: ModalViewProps) {
  const { modals, containerSize, updateBounds, setMinimized, bringToFront } =
    useModalStore.getState();
  const opts: ModalOptions = {
    resizable: true,
    minimizable: true,
    collisionDetection: false,
    allowRedistribute: false,
    closeOnBackdropClick: false,
    minWidth: DEFAULT_MIN.width,
    minHeight: DEFAULT_MIN.height,
    ...item.options,
  };

  const boxRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<string | null>(null);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const resizeStart = useRef({
    pointerX: 0,
    pointerY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const clampBounds = useCallback(
    (b: { x: number; y: number; width: number; height: number }) => {
      const minW = opts.minWidth ?? DEFAULT_MIN.width;
      const minH = opts.minHeight ?? DEFAULT_MIN.height;
      const maxW = opts.maxWidth ?? containerSize.width;
      const maxH = opts.maxHeight ?? containerSize.height;
      return {
        x: Math.max(0, Math.min(b.x, containerSize.width - minW)),
        y: Math.max(0, Math.min(b.y, containerSize.height - minH)),
        width: Math.max(minW, Math.min(maxW, b.width)),
        height: Math.max(minH, Math.min(maxH, b.height)),
      };
    },
    [
      containerSize,
      opts.minWidth,
      opts.minHeight,
      opts.maxWidth,
      opts.maxHeight,
    ],
  );

  const others = modals.filter((m) => m.id !== item.id && !m.minimized);

  const handlePointerDownHeader = useCallback(
    (e: React.PointerEvent) => {
      if (
        (e.target as HTMLElement).closest("button") ||
        (e.target as HTMLElement).closest("[data-resize]")
      )
        return;
      e.preventDefault();
      bringToFront(item.id);
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        left: item.bounds.x,
        top: item.bounds.y,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [item.id, item.bounds.x, item.bounds.y, bringToFront],
  );

  const handlePointerDownResize = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      bringToFront(item.id);
      setResizeEdge("se");
      resizeStart.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        x: item.bounds.x,
        y: item.bounds.y,
        width: item.bounds.width,
        height: item.bounds.height,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [item.id, item.bounds, bringToFront],
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      let dx = e.clientX - dragStart.current.x;
      let dy = e.clientY - dragStart.current.y;
      const newBounds = {
        ...item.bounds,
        x: dragStart.current.left + dx,
        y: dragStart.current.top + dy,
      };
      if (opts.collisionDetection && others.length > 0) {
        const { dx: cdx, dy: cdy } = resolveCollisionsWithOthers(
          newBounds,
          others.map((m) => ({ id: m.id, bounds: m.bounds })),
          item.id,
        );
        newBounds.x += cdx;
        newBounds.y += cdy;
      }
      const clamped = clampBounds(newBounds);
      updateBounds(item.id, { x: clamped.x, y: clamped.y });
    };
    const onUp = () => {
      setIsDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [
    isDragging,
    item.id,
    item.bounds,
    others,
    opts.collisionDetection,
    updateBounds,
    clampBounds,
  ]);

  useEffect(() => {
    if (!resizeEdge) return;
    const onMove = (e: PointerEvent) => {
      const { pointerX, pointerY, x, y, width, height } = resizeStart.current;
      const dx = e.clientX - pointerX;
      const dy = e.clientY - pointerY;
      const w = Math.max(opts.minWidth ?? DEFAULT_MIN.width, width + dx);
      const h = Math.max(opts.minHeight ?? DEFAULT_MIN.height, height + dy);
      const clamped = clampBounds({ x, y, width: w, height: h });
      updateBounds(item.id, clamped);
    };
    const onUp = () => {
      setResizeEdge(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [
    resizeEdge,
    item.id,
    updateBounds,
    clampBounds,
    opts.minWidth,
    opts.minHeight,
  ]);

  const scrollSyncUnregister = useRef<(() => void) | null>(null);
  useEffect(() => {
    const group = opts.scrollSyncGroup;
    if (!group || !boxRef.current) return;
    const sync = scrollSyncGroups.get(group);
    if (!sync) return;
    scrollSyncUnregister.current = sync.register(boxRef.current);
    return () => {
      scrollSyncUnregister.current?.();
      scrollSyncUnregister.current = null;
    };
  }, [opts.scrollSyncGroup, scrollSyncGroups]);

  if (item.minimized) return null;

  const canResize = opts.resizable !== false;

  const rootClassName = ["split-viewer-modal", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={item.title ? `modal-title-${item.id}` : undefined}
      tabIndex={0}
      className={rootClassName}
      style={{
        position: "absolute",
        left: item.bounds.x,
        top: item.bounds.y,
        width: item.bounds.width,
        height: item.bounds.height,
        zIndex: item.zIndex,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minWidth: opts.minWidth ?? DEFAULT_MIN.width,
        minHeight: opts.minHeight ?? DEFAULT_MIN.height,
      }}
    >
      <div
        className="split-viewer-modal__header"
        data-modal-header
        onPointerDown={handlePointerDownHeader}
        style={{
          padding: "8px 12px",
          cursor: "move",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span
          className="split-viewer-modal__title"
          id={item.title ? `modal-title-${item.id}` : undefined}
        >
          {item.title ?? item.id}
        </span>
        <div
          className="split-viewer-modal__header-actions"
          style={{ display: "flex", gap: 4 }}
        >
          {opts.minimizable !== false && (
            <button
              type="button"
              className="split-viewer-modal__btn"
              aria-label="Minimize"
              onClick={() => setMinimized(item.id, true)}
            >
              −
            </button>
          )}
        </div>
      </div>
      <div
        className="split-viewer-modal__body"
        style={{ flex: 1, overflow: "auto", padding: 12 }}
      >
        {item.content}
      </div>
      {canResize && (
        <div
          className="split-viewer-modal__resize-handle"
          data-resize
          onPointerDown={handlePointerDownResize}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 20,
            height: 20,
            cursor: "nwse-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Resize"
        >
          <svg
            className="split-viewer-modal__resize-icon"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M12 12H8v-2h2V8h2v4z" />
          </svg>
        </div>
      )}
    </div>
  );
}
