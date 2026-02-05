import React, { useCallback, useEffect, useRef } from "react";
import { useModalStore } from "../store/useModalStore";
import type { ModalControllerOptions } from "../types";
import { createScrollSync } from "../utils/scrollSync";
import { MinimizedBar } from "./MinimizedBar";
import { ModalView } from "./ModalView";

const scrollSyncGroups = new Map<string, ReturnType<typeof createScrollSync>>();

function getOrCreateScrollSync(groupId: string) {
  let sync = scrollSyncGroups.get(groupId);
  if (!sync) {
    sync = createScrollSync(groupId);
    scrollSyncGroups.set(groupId, sync);
  }
  return sync;
}

export interface ModalControllerProps extends ModalControllerOptions {
  /** 컨트롤러 자식 없이 사용 시 모달만 렌더 (모달 추가는 store.addModal으로) */
  children?: React.ReactNode;
}

export function ModalController({
  minimizedBarPosition = "bottom",
  width = "100vw",
  height = "100vh",
  className,
  toolbarClassName,
  minimizedBarClassName,
  modalClassName,
  collisionDetection: defaultCollisionDetection,
  closeButtonClassName,
  closeButtonChildren,
  children,
}: ModalControllerProps) {
  const modals = useModalStore((s) => s.modals);
  const setContainerSize = useModalStore((s) => s.setContainerSize);
  const scaleAllModals = useModalStore((s) => s.scaleAllModals);
  const redistributeEqual = useModalStore((s) => s.redistributeEqual);
  const getLayoutSnapshot = useModalStore((s) => s.getLayoutSnapshot);
  const applyLayoutSnapshot = useModalStore((s) => s.applyLayoutSnapshot);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCopyLayout = useCallback(() => {
    const snapshot = getLayoutSnapshot();
    if (Object.keys(snapshot.boundsById).length === 0) return;
    try {
      navigator.clipboard.writeText(JSON.stringify(snapshot));
    } catch (_) {}
  }, [getLayoutSnapshot]);

  const handlePasteLayout = useCallback(() => {
    navigator.clipboard
      .readText()
      .then((text) => {
        try {
          const snapshot = JSON.parse(text);
          applyLayoutSnapshot(snapshot);
        } catch (_) {}
      })
      .catch(() => {});
  }, [applyLayoutSnapshot]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width: w, height: h } = entries[0]?.contentRect ?? {
        width: 800,
        height: 600,
      };
      setContainerSize(w, h);
    });
    ro.observe(el);
    setContainerSize(el.clientWidth, el.clientHeight);
    return () => ro.disconnect();
  }, [setContainerSize]);

  const openModals = modals.filter((m) => !m.minimized);
  const ordered = [...openModals].sort((a, b) => a.zIndex - b.zIndex);
  const topModal = ordered[ordered.length - 1];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const open = modals.filter((m) => !m.minimized);
      if (open.length === 0) return;
      e.preventDefault();
      useModalStore.getState().closeTopModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modals]);

  useEffect(() => {
    modals.forEach((m) => {
      const g = m.options?.scrollSyncGroup;
      if (g) getOrCreateScrollSync(g);
    });
  }, [modals]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return;
      if (!topModal) return;
      const closeOnBackdrop = topModal.options?.closeOnBackdropClick ?? false;
      if (!closeOnBackdrop) return;
      const { closeTopModal } = useModalStore.getState();
      closeTopModal();
    },
    [topModal]
  );

  return (
    <div
      ref={containerRef}
      className={["split-viewer-controller", className]
        .filter(Boolean)
        .join(" ")}
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
      }}
    >
      {children}
      <MinimizedBar
        position={minimizedBarPosition}
        className={minimizedBarClassName}
        closeButtonClassName={closeButtonClassName}
        closeButtonChildren={closeButtonChildren}
      />
      {openModals.length > 0 && (
        <div
          className={["split-viewer-toolbar", toolbarClassName]
            .filter(Boolean)
            .join(" ")}
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
          }}
        >
          <span className="split-viewer-toolbar__label">Resize all</span>
          <button
            type="button"
            className="split-viewer-toolbar__btn"
            aria-label="Shrink all"
            onClick={() => scaleAllModals(0.9)}
          >
            −
          </button>
          <button
            type="button"
            className="split-viewer-toolbar__btn"
            aria-label="Grow all"
            onClick={() => scaleAllModals(1.1)}
          >
            +
          </button>
          <button
            type="button"
            className="split-viewer-toolbar__btn"
            aria-label="Redistribute equal"
            onClick={() => redistributeEqual()}
          >
            ⊞
          </button>
          <span
            className="split-viewer-toolbar__label"
            style={{ marginLeft: 8 }}
          >
            Layout
          </span>
          <button
            type="button"
            className="split-viewer-toolbar__btn"
            aria-label="Copy layout"
            onClick={handleCopyLayout}
            title="Copy current modal layout to clipboard"
          >
            📋
          </button>
          <button
            type="button"
            className="split-viewer-toolbar__btn"
            aria-label="Paste layout"
            onClick={handlePasteLayout}
            title="Apply layout from clipboard"
          >
            📄
          </button>
        </div>
      )}
      <div
        className="split-viewer-backdrop"
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: openModals.length > 0 ? "auto" : "none",
        }}
        onClick={handleBackdropClick}
      />
      {modals.map((item) => (
        <ModalView
          key={item.id}
          item={item}
          scrollSyncGroups={scrollSyncGroups}
          className={modalClassName}
          collisionDetection={defaultCollisionDetection}
          closeButtonClassName={closeButtonClassName}
          closeButtonChildren={closeButtonChildren}
        />
      ))}
    </div>
  );
}

export { getOrCreateScrollSync, scrollSyncGroups };
