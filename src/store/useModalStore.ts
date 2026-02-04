import { create } from "zustand";
import type { ModalBounds, ModalItem, ModalOptions } from "../types";

let nextZ = 1;
function getNextZIndex() {
  return nextZ++;
}

export interface AddModalPayload {
  id: string;
  content: React.ReactNode;
  title?: string;
  options?: ModalOptions;
  /** 초기 bounds (없으면 중앙 기본 크기) */
  bounds?: Partial<ModalBounds>;
}

interface ModalState {
  modals: ModalItem[];
  containerSize: { width: number; height: number };
  setContainerSize: (w: number, h: number) => void;
  addModal: (payload: AddModalPayload) => void;
  removeModal: (id: string) => void;
  updateBounds: (id: string, bounds: Partial<ModalBounds>) => void;
  setMinimized: (id: string, minimized: boolean) => void;
  bringToFront: (id: string) => void;
  redistributeEqual: () => void;
  closeTopModal: () => void;
  /** 모든 열린 모달의 크기/위치를 일괄 비율 조정 (공용 컨트롤러에서 사용) */
  scaleAllModals: (factor: number) => void;
  /** 현재 열린 모달 레이아웃 스냅샷 (복사용) */
  getLayoutSnapshot: () => ModalLayoutSnapshot;
  /** 스냅샷 적용 (id 일치하는 모달만 bounds 갱신) */
  applyLayoutSnapshot: (snapshot: ModalLayoutSnapshot) => void;
}

/** 모달 레이아웃 복사/붙여넣기용 스냅샷 (직렬화 가능) */
export interface ModalLayoutSnapshot {
  version: 1;
  boundsById: Record<string, ModalBounds>;
}

const defaultBounds = (
  containerWidth: number,
  containerHeight: number,
): ModalBounds => {
  const w = Math.min(400, Math.max(280, containerWidth * 0.4));
  const h = Math.min(400, Math.max(200, containerHeight * 0.4));
  return {
    x: (containerWidth - w) / 2,
    y: (containerHeight - h) / 2,
    width: w,
    height: h,
  };
};

export const useModalStore = create<ModalState>((set, get) => ({
  modals: [],
  containerSize: {
    width: typeof window !== "undefined" ? window.innerWidth : 800,
    height: typeof window !== "undefined" ? window.innerHeight : 600,
  },

  setContainerSize: (width, height) =>
    set({ containerSize: { width, height } }),

  addModal: (payload) => {
    const { containerSize } = get();
    const bounds: ModalBounds = {
      ...defaultBounds(containerSize.width, containerSize.height),
      ...payload.bounds,
    };
    const modal: ModalItem = {
      id: payload.id,
      content: payload.content,
      bounds,
      minimized: false,
      zIndex: getNextZIndex(),
      title: payload.title,
      options: payload.options,
    };
    set((s) => ({ modals: [...s.modals, modal] }));
  },

  removeModal: (id) =>
    set((s) => ({ modals: s.modals.filter((m) => m.id !== id) })),

  updateBounds: (id, partial) => {
    set((s) => ({
      modals: s.modals.map((m) =>
        m.id === id ? { ...m, bounds: { ...m.bounds, ...partial } } : m,
      ),
    }));
  },

  setMinimized: (id, minimized) => {
    set((s) => ({
      modals: s.modals.map((m) => (m.id === id ? { ...m, minimized } : m)),
    }));
  },

  bringToFront: (id) => {
    const z = getNextZIndex();
    set((s) => ({
      modals: s.modals.map((m) => (m.id === id ? { ...m, zIndex: z } : m)),
    }));
  },

  redistributeEqual: () => {
    const { modals, containerSize } = get();
    const open = modals.filter((m) => !m.minimized);
    if (open.length === 0) return;
    const n = open.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const w = containerSize.width / cols;
    const h = containerSize.height / rows;
    set((s) => ({
      modals: s.modals.map((m) => {
        if (m.minimized) return m;
        const i = open.findIndex((x) => x.id === m.id);
        const col = i % cols;
        const row = Math.floor(i / cols);
        return {
          ...m,
          bounds: {
            x: col * w,
            y: row * h,
            width: w,
            height: h,
          },
        };
      }),
    }));
  },

  closeTopModal: () => {
    const { modals } = get();
    const ordered = [...modals].sort((a, b) => b.zIndex - a.zIndex);
    const top = ordered.find((m) => !m.minimized);
    if (top) {
      const opts = top.options;
      if (opts?.minimizable) {
        get().setMinimized(top.id, true);
      } else {
        get().removeModal(top.id);
      }
    }
  },

  scaleAllModals: (factor) => {
    const { modals, containerSize } = get();
    const open = modals.filter((m) => !m.minimized);
    if (open.length === 0) return;
    const minW = 200;
    const minH = 120;
    set((s) => ({
      modals: s.modals.map((m) => {
        if (m.minimized) return m;
        const b = m.bounds;
        const x = Math.max(
          0,
          Math.min(b.x * factor, containerSize.width - minW),
        );
        const y = Math.max(
          0,
          Math.min(b.y * factor, containerSize.height - minH),
        );
        const width = Math.max(
          minW,
          Math.min(b.width * factor, containerSize.width - x),
        );
        const height = Math.max(
          minH,
          Math.min(b.height * factor, containerSize.height - y),
        );
        return { ...m, bounds: { x, y, width, height } };
      }),
    }));
  },

  getLayoutSnapshot: () => {
    const { modals } = get();
    const open = modals.filter((m) => !m.minimized);
    const boundsById: Record<string, ModalBounds> = {};
    open.forEach((m) => {
      boundsById[m.id] = { ...m.bounds };
    });
    return { version: 1, boundsById };
  },

  applyLayoutSnapshot: (snapshot) => {
    if (snapshot?.version !== 1 || !snapshot.boundsById) return;
    const { containerSize } = get();
    const minW = 200;
    const minH = 120;
    set((s) => ({
      modals: s.modals.map((m) => {
        const b = snapshot.boundsById[m.id];
        if (!b || m.minimized) return m;
        const bounds = {
          x: Math.max(0, Math.min(b.x, containerSize.width - minW)),
          y: Math.max(0, Math.min(b.y, containerSize.height - minH)),
          width: Math.max(minW, Math.min(b.width, containerSize.width - b.x)),
          height: Math.max(
            minH,
            Math.min(b.height, containerSize.height - b.y),
          ),
        };
        return { ...m, bounds };
      }),
    }));
  },
}));
