import React from "react";
import { useModalStore } from "../store/useModalStore";

export type MinimizedBarPosition = "top" | "bottom" | "left" | "right";

export interface MinimizedBarProps {
  position?: MinimizedBarPosition;
  /** 루트에 적용할 className */
  className?: string;
}

export function MinimizedBar({
  position = "bottom",
  className,
}: MinimizedBarProps) {
  const modals = useModalStore((s) => s.modals.filter((m) => m.minimized));
  const setMinimized = useModalStore((s) => s.setMinimized);

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
        <button
          key={m.id}
          type="button"
          className="split-viewer-minimized-bar__item"
          onClick={() => setMinimized(m.id, false)}
          style={{
            padding: "6px 12px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: isVertical ? 160 : 140,
          }}
        >
          {m.title ?? m.id}
        </button>
      ))}
    </div>
  );
}
