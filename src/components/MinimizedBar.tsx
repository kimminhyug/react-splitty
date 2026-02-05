import type { ReactNode } from "react";
import React from "react";
import { useModalStore } from "../store/useModalStore";
import type { ModalItem } from "../types";

export type MinimizedBarPosition = "top" | "bottom" | "left" | "right";

export interface MinimizedBarProps {
  position?: MinimizedBarPosition;
  /** 루트에 적용할 className */
  className?: string;
  /** 닫기 버튼 기본 className (모달 options로 오버라이드 가능) */
  closeButtonClassName?: string;
  /** 닫기 버튼 기본 children (모달 options로 오버라이드 가능) */
  closeButtonChildren?: ReactNode;
}

const DEFAULT_CLOSE_LABEL = "×";

interface MinimizedBarItemProps {
  item: ModalItem;
  isVertical: boolean;
  onRestore: () => void;
  onClose: () => void;
  closeButtonClassName?: string;
  closeButtonChildren?: ReactNode;
}

function MinimizedBarItem({
  item,
  isVertical,
  onRestore,
  onClose,
  closeButtonClassName,
  closeButtonChildren,
}: MinimizedBarItemProps) {
  return (
    <div
      className="split-viewer-minimized-bar__item"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        maxWidth: isVertical ? 160 : 140,
      }}
    >
      <button
        type="button"
        className="split-viewer-minimized-bar__item-label"
        onClick={onRestore}
        style={{
          padding: "6px 10px 6px 12px",
          cursor: "pointer",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          flex: 1,
          minWidth: 0,
        }}
      >
        {item.title ?? item.id}
      </button>
      <button
        type="button"
        className={["split-viewer-minimized-bar__close", closeButtonClassName]
          .filter(Boolean)
          .join(" ")}
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          flexShrink: 0,
          padding: "6px 8px",
          cursor: "pointer",
        }}
      >
        {closeButtonChildren}
      </button>
    </div>
  );
}

export function MinimizedBar({
  position = "bottom",
  className,
  closeButtonClassName: defaultCloseButtonClassName,
  closeButtonChildren: defaultCloseButtonChildren,
}: MinimizedBarProps) {
  const modals = useModalStore((s) => s.modals.filter((m) => m.minimized));
  const setMinimized = useModalStore((s) => s.setMinimized);
  const removeModal = useModalStore((s) => s.removeModal);

  if (modals.length === 0) return null;

  const isVertical = position === "left" || position === "right";
  const style: React.CSSProperties = {
    position: "absolute",
    display: "flex",
    gap: 4,
    padding: 6,
    zIndex: 9998,
    flexDirection: isVertical ? "column" : "row",
    ...(position === "top" && { top: 8, left: 8, right: 8 }),
    ...(position === "bottom" && { bottom: 8, left: 8, right: 8 }),
    ...(position === "left" && { left: 8, top: 8, bottom: 8 }),
    ...(position === "right" && { right: 8, top: 8, bottom: 8 }),
  };

  const rootClassName = ["split-viewer-minimized-bar", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      style={style}
      role="toolbar"
      aria-label="Minimized modals"
    >
      {modals.map((m) => (
        <MinimizedBarItem
          key={m.id}
          item={m}
          isVertical={isVertical}
          onRestore={() => setMinimized(m.id, false)}
          onClose={() => removeModal(m.id)}
          closeButtonClassName={
            m.options?.closeButtonClassName ?? defaultCloseButtonClassName
          }
          closeButtonChildren={
            m.options?.closeButtonChildren ??
            defaultCloseButtonChildren ??
            DEFAULT_CLOSE_LABEL
          }
        />
      ))}
    </div>
  );
}
