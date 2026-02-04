/** 스크롤 동기화: 같은 그룹의 스크롤 가능 엘리먼트들에 리스너 부착 */
export function createScrollSync(groupId: string) {
  const listeners = new Map<Element, () => void>();

  function getScrollable(el: Element | null): Element | null {
    if (!el) return null;
    const style = getComputedStyle(el);
    const overflowY = style.overflowY;
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    )
      return el;
    return getScrollable(el.parentElement);
  }

  function syncFrom(source: Element, scrollTop: number, scrollLeft: number) {
    listeners.forEach((_, target) => {
      if (target === source) return;
      if (target instanceof HTMLElement) {
        target.scrollTop = scrollTop;
        target.scrollLeft = scrollLeft;
      }
    });
  }

  function register(element: Element | null): () => void {
    const scrollable = element ? getScrollable(element) : null;
    if (!scrollable) return () => {};

    const handler = () => {
      if (scrollable instanceof HTMLElement) {
        syncFrom(scrollable, scrollable.scrollTop, scrollable.scrollLeft);
      }
    };
    scrollable.addEventListener("scroll", handler, { passive: true });
    listeners.set(scrollable, handler);
    return () => {
      scrollable.removeEventListener("scroll", handler);
      listeners.delete(scrollable);
    };
  }

  return { register, groupId };
}

export type ScrollSyncInstance = ReturnType<typeof createScrollSync>;
