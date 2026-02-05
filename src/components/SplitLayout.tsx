import type { ReactNode } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { SplitLayoutSnapshot } from "../types";

const DEFAULT_MIN_PERCENT = 8;

function normalizePercent(values: number[], minP: number): number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum <= 0) return values.map(() => 100 / values.length);
  return values.map((v) => Math.max(minP, (v / sum) * 100));
}

function defaultRowHeights(rows: number): number[] {
  return Array.from({ length: rows }, () => 100 / rows);
}

function defaultColWidths(cols: number): number[] {
  return Array.from({ length: cols }, () => 100 / cols);
}

export interface SplitLayoutProps {
  /** 행 개수 */
  rows: number;
  /** 열 개수 */
  cols: number;
  /** 셀 콘텐츠 (행 우선: [0,0], [0,1], ..., [1,0], ...) */
  children: ReactNode[];
  /** 초기 행 높이 비율 (%) */
  initialRowHeights?: number[];
  /** 초기 열 너비 비율 (%) */
  initialColWidths?: number[];
  /** 셀 최소 높이 비율 (%) */
  minRowHeightPercent?: number;
  /** 셀 최소 너비 비율 (%) */
  minColWidthPercent?: number;
  /** 레이아웃 변경 시 콜백 */
  onLayoutChange?: (snapshot: SplitLayoutSnapshot) => void;
  /** 컨테이너 리사이즈 시 콜백 (ResizeObserver) */
  onResize?: (size: { width: number; height: number }) => void;
  className?: string;
  toolbarClassName?: string;
  dividerClassName?: string;
  cellClassName?: string;
  /** ref로 getLayoutSnapshot / applyLayoutSnapshot 노출 */
  layoutRef?: React.RefObject<SplitLayoutRef | null>;
  /** 바깥 테두리 리사이즈 허용 (우측 하단 핸들) */
  resizable?: boolean;
  /** 바깥 리사이즈 버튼(핸들)에 적용할 className */
  resizeButtonClassName?: string;
  /** 바깥 박스 최소 너비 (px) */
  minOuterWidth?: number;
  /** 바깥 박스 최소 높이 (px) */
  minOuterHeight?: number;
}

export interface SplitLayoutRef {
  getLayoutSnapshot: () => SplitLayoutSnapshot;
  applyLayoutSnapshot: (snapshot: SplitLayoutSnapshot) => void;
}

export function SplitLayout({
  rows,
  cols,
  children,
  initialRowHeights: initialRows,
  initialColWidths: initialCols,
  minRowHeightPercent = DEFAULT_MIN_PERCENT,
  minColWidthPercent = DEFAULT_MIN_PERCENT,
  onLayoutChange,
  onResize,
  className,
  toolbarClassName,
  dividerClassName,
  cellClassName,
  layoutRef,
  resizable = true,
  resizeButtonClassName,
  minOuterWidth = 200,
  minOuterHeight = 160,
}: SplitLayoutProps) {
  const [outerSize, setOuterSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [outerDragging, setOuterDragging] = useState(false);
  const outerDragStart = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const [rowHeights, setRowHeights] = useState<number[]>(() =>
    initialRows && initialRows.length === rows
      ? normalizePercent(initialRows, minRowHeightPercent)
      : defaultRowHeights(rows),
  );
  const [colWidths, setColWidths] = useState<number[]>(() =>
    initialCols && initialCols.length === cols
      ? normalizePercent(initialCols, minColWidthPercent)
      : defaultColWidths(cols),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [dragging, setDragging] = useState<
    { type: "row"; index: number } | { type: "col"; index: number } | null
  >(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const prevDraggingRef = useRef<typeof dragging>(null);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      const width = rect?.width ?? 0;
      const height = rect?.height ?? 0;
      setContainerSize({ width, height });
      onResizeRef.current?.({ width, height });
    });
    ro.observe(el);
    const w = el.clientWidth;
    const h = el.clientHeight;
    setContainerSize({ width: w, height: h });
    onResizeRef.current?.({ width: w, height: h });
    return () => ro.disconnect();
  }, []);

  const getSnapshot = useCallback(
    (): SplitLayoutSnapshot => ({
      version: 1,
      rowHeights: [...rowHeights],
      colWidths: [...colWidths],
    }),
    [rowHeights, colWidths],
  );

  const applySnapshot = useCallback(
    (snapshot: SplitLayoutSnapshot) => {
      if (snapshot?.version !== 1) return;
      if (snapshot.rowHeights?.length === rows)
        setRowHeights(
          normalizePercent(snapshot.rowHeights, minRowHeightPercent),
        );
      if (snapshot.colWidths?.length === cols)
        setColWidths(normalizePercent(snapshot.colWidths, minColWidthPercent));
    },
    [rows, cols, minRowHeightPercent, minColWidthPercent],
  );

  useEffect(() => {
    if (!layoutRef) return;
    (layoutRef as React.MutableRefObject<SplitLayoutRef | null>).current = {
      getLayoutSnapshot: getSnapshot,
      applyLayoutSnapshot: applySnapshot,
    };
    return () => {
      (layoutRef as React.MutableRefObject<SplitLayoutRef | null>).current =
        null;
    };
  }, [layoutRef, getSnapshot, applySnapshot]);

  useEffect(() => {
    if (!dragging) return;
    const type = dragging.type;
    const index = dragging.index;

    const onMove = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const width = el.clientWidth;
      const height = el.clientHeight;
      if (type === "row" && height > 0) {
        const dy = e.clientY - dragStart.current.y;
        const deltaPercent = (dy / height) * 100;
        setRowHeights((prev) => {
          const next = [...prev];
          const a = index;
          const b = index + 1;
          const minP = minRowHeightPercent;
          let va = next[a] + deltaPercent;
          let vb = next[b] - deltaPercent;
          if (va < minP) {
            vb += va - minP;
            va = minP;
          }
          if (vb < minP) {
            va += vb - minP;
            vb = minP;
          }
          next[a] = va;
          next[b] = vb;
          return next;
        });
      }
      if (type === "col" && width > 0) {
        const dx = e.clientX - dragStart.current.x;
        const deltaPercent = (dx / width) * 100;
        setColWidths((prev) => {
          const next = [...prev];
          const a = index;
          const b = index + 1;
          const minP = minColWidthPercent;
          let va = next[a] + deltaPercent;
          let vb = next[b] - deltaPercent;
          if (va < minP) {
            vb += va - minP;
            va = minP;
          }
          if (vb < minP) {
            va += vb - minP;
            vb = minP;
          }
          next[a] = va;
          next[b] = vb;
          return next;
        });
      }
      dragStart.current.x = e.clientX;
      dragStart.current.y = e.clientY;
    };
    const onUp = () => {
      setDragging(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, minRowHeightPercent, minColWidthPercent]);

  useEffect(() => {
    const wasDragging = prevDraggingRef.current !== null;
    prevDraggingRef.current = dragging;
    if (wasDragging && dragging === null) {
      onLayoutChange?.(getSnapshot());
    }
  }, [dragging, getSnapshot, onLayoutChange]);

  const handleRowDividerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.preventDefault();
      setDragging({ type: "row", index });
      dragStart.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [],
  );

  const handleColDividerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.preventDefault();
      setDragging({ type: "col", index });
      dragStart.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [],
  );

  const handleOuterResizeDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setOuterSize({ width: rect.width, height: rect.height });
    setOuterDragging(true);
    outerDragStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: rect.width,
      height: rect.height,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  useEffect(() => {
    if (!outerDragging) return;
    const onMove = (e: PointerEvent) => {
      const { x, y, width, height } = outerDragStart.current;
      const newWidth = Math.max(minOuterWidth, width + (e.clientX - x));
      const newHeight = Math.max(minOuterHeight, height + (e.clientY - y));
      setOuterSize({ width: newWidth, height: newHeight });
    };
    const onUp = () => setOuterDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [outerDragging, minOuterWidth, minOuterHeight]);

  const handleCopyLayout = useCallback(() => {
    try {
      navigator.clipboard.writeText(JSON.stringify(getSnapshot()));
    } catch (_) {}
  }, [getSnapshot]);

  const handlePasteLayout = useCallback(() => {
    navigator.clipboard
      .readText()
      .then((text) => {
        try {
          const snapshot = JSON.parse(text) as SplitLayoutSnapshot;
          applySnapshot(snapshot);
          onLayoutChange?.(snapshot);
        } catch (_) {}
      })
      .catch(() => {});
  }, [applySnapshot, onLayoutChange]);

  const rootClassName = ["split-layout", className].filter(Boolean).join(" ");
  const toolbarClass = ["split-layout__toolbar", toolbarClassName]
    .filter(Boolean)
    .join(" ");
  const dividerClass = ["split-layout__divider", dividerClassName]
    .filter(Boolean)
    .join(" ");
  const cellClass = ["split-layout__cell", cellClassName]
    .filter(Boolean)
    .join(" ");

  const totalCells = rows * cols;
  const flatChildren = Array.isArray(children) ? children : [children];
  const cells = flatChildren.slice(0, totalCells);

  const wrapperStyle: React.CSSProperties = {
    position: "relative",
    width: outerSize ? outerSize.width : "100%",
    height: outerSize ? outerSize.height : "100%",
    minWidth: minOuterWidth,
    minHeight: minOuterHeight,
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div ref={wrapperRef} className={rootClassName} style={wrapperStyle}>
      <div
        ref={containerRef}
        className="split-layout__inner"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className={toolbarClass}
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
          }}
        >
          <span className="split-layout__toolbar-label">Layout</span>
          <button
            type="button"
            className="split-layout__toolbar-btn"
            aria-label="Copy layout"
            onClick={handleCopyLayout}
            title="Copy split ratios to clipboard"
          >
            📋
          </button>
          <button
            type="button"
            className="split-layout__toolbar-btn"
            aria-label="Paste layout"
            onClick={handlePasteLayout}
            title="Apply layout from clipboard"
          >
            📄
          </button>
        </div>
        <div
          className="split-layout__grid"
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {rowHeights.map((rowPct, r) => (
            <React.Fragment key={r}>
              <div
                style={{
                  display: "flex",
                  flex: rowPct,
                  minHeight: 0,
                }}
              >
                {colWidths.map((colPct, c) => (
                  <React.Fragment key={c}>
                    <div
                      className={cellClass}
                      style={{
                        flex: colPct,
                        minWidth: 0,
                        overflow: "auto",
                      }}
                    >
                      {cells[r * cols + c] ?? null}
                    </div>
                    {c < cols - 1 && (
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        className={dividerClass}
                        onPointerDown={(e) => handleColDividerDown(e, c)}
                        style={{
                          width: 8,
                          flexShrink: 0,
                          cursor: "col-resize",
                          minWidth: 8,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              {r < rows - 1 && (
                <div
                  role="separator"
                  aria-orientation="horizontal"
                  className={dividerClass}
                  onPointerDown={(e) => handleRowDividerDown(e, r)}
                  style={{
                    height: 8,
                    flexShrink: 0,
                    cursor: "row-resize",
                    minHeight: 8,
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      {resizable && (
        <div
          role="separator"
          aria-label="Resize layout"
          className={["split-layout__outer-resize", resizeButtonClassName]
            .filter(Boolean)
            .join(" ")}
          onPointerDown={handleOuterResizeDown}
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
            className="split-layout__outer-resize-icon"
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
