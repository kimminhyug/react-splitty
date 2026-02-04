import type { ReactNode } from "react";

/** 단일 모달의 화면상 위치/크기 */
export interface ModalBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 모달 아이템 (스토어에서 관리) */
export interface ModalItem {
  id: string;
  /** 사용자가 넣은 컨텐츠 */
  content: ReactNode;
  /** 현재 위치/크기 */
  bounds: ModalBounds;
  /** 최소화 여부 */
  minimized: boolean;
  /** z-index (포커스 순서) */
  zIndex: number;
  /** 제목 등 표시용 (선택) */
  title?: string;
  /** 모달별 옵션 (선택) */
  options?: ModalOptions;
}

/** 모달별 옵션 (각 모달에 props로 전달) */
export interface ModalOptions {
  /** 충돌 감지 사용 여부 */
  collisionDetection?: boolean;
  /** 리사이즈 가능 여부 */
  resizable?: boolean;
  /** 스크롤 동기화 (같은 그룹 id면 동기화) */
  scrollSyncGroup?: string | null;
  /** n분의 1 재배분 버튼/기능 사용 */
  allowRedistribute?: boolean;
  /** 최소화 가능 여부 */
  minimizable?: boolean;
  /** 바깥 클릭 시 닫기 (닫기 = 최소화 또는 제거는 앱에서 결정) */
  closeOnBackdropClick?: boolean;
  /** 최소 너비 (px) */
  minWidth?: number;
  /** 최소 높이 (px) */
  minHeight?: number;
  /** 최대 너비 (px, 선택) */
  maxWidth?: number;
  /** 최대 높이 (px, 선택) */
  maxHeight?: number;
}

/** 컨트롤러(최상위) 옵션 */
export interface ModalControllerOptions {
  /** 최소화된 모달이 모여있는 구역 위치 */
  minimizedBarPosition?: "top" | "bottom" | "left" | "right";
  /** 컨트롤러 영역 전체 크기 (기본 100vw/100vh) */
  width?: number | string;
  height?: number | string;
  /** 컨트롤러 루트에 적용할 className */
  className?: string;
  /** 모든 모달 크기 툴바에 적용할 className */
  toolbarClassName?: string;
  /** 최소화 바에 적용할 className (MinimizedBar에 전달) */
  minimizedBarClassName?: string;
  /** 각 모달 루트에 적용할 className */
  modalClassName?: string;
}

export type ModalId = string;

/** SplitLayout 셀 비율 (행/열별 %, 합 100) */
export interface SplitLayoutSnapshot {
  version: 1;
  rowHeights: number[];
  colWidths: number[];
}

/** SplitLayout 옵션 */
export interface SplitLayoutOptions {
  /** 행 개수 */
  rows: number;
  /** 열 개수 */
  cols: number;
  /** 초기 행 높이 비율 (%) - 합 100, 미지정 시 균등 */
  initialRowHeights?: number[];
  /** 초기 열 너비 비율 (%) - 합 100, 미지정 시 균등 */
  initialColWidths?: number[];
  /** 셀 최소 높이 비율 (%) */
  minRowHeightPercent?: number;
  /** 셀 최소 너비 비율 (%) */
  minColWidthPercent?: number;
  /** 레이아웃 변경 시 콜백 */
  onLayoutChange?: (snapshot: SplitLayoutSnapshot) => void;
  /** 컨테이너 리사이즈 시 콜백 (ResizeObserver) */
  onResize?: (size: { width: number; height: number }) => void;
  /** 루트 className */
  className?: string;
  /** 툴바 className */
  toolbarClassName?: string;
  /** 구분선 className */
  dividerClassName?: string;
  /** 셀 래퍼 className */
  cellClassName?: string;
  /** 바깥 테두리 리사이즈 허용 (우측 하단 핸들) */
  resizable?: boolean;
  /** 바깥 박스 최소 너비 (px) */
  minOuterWidth?: number;
  /** 바깥 박스 최소 높이 (px) */
  minOuterHeight?: number;
}
