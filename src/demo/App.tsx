import { useId, useState } from "react";
import { ModalController, SplitLayout, useModalStore } from "../index";

type DemoView = "modal" | "layout";

function App() {
  const [view, setView] = useState<DemoView>("modal");
  const [counter, setCounter] = useState(0);
  const addModal = useModalStore((s) => s.addModal);
  const id = useId();

  const openModal = (options?: Parameters<typeof addModal>[0]["options"]) => {
    const n = counter + 1;
    setCounter(n);
    addModal({
      id: `modal-${id}-${n}`,
      title: `Viewer ${n}`,
      content: (
        <div>
          <p>Modal content. {n}</p>
          <p>Scroll test:</p>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i}>Line {i + 1}</p>
          ))}
        </div>
      ),
      options: {
        resizable: true,
        minimizable: true,
        collisionDetection: true,
        allowRedistribute: true,
        closeOnBackdropClick: false,
        minWidth: 200,
        minHeight: 120,
        ...options,
      },
    });
  };

  const openModalWithSplitLayout = () => {
    const n = counter + 1;
    setCounter(n);
    addModal({
      id: `modal-layout-${id}-${n}`,
      title: `SplitLayout in modal`,
      content: (
        <div
          style={{
            height: 320,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SplitLayout
            rows={2}
            cols={2}
            toolbarClassName="split-layout__toolbar"
            cellClassName="split-layout__cell"
          >
            {["A", "B", "C", "D"].map((label, i) => (
              <div key={i} style={{ padding: 8 }}>
                <strong>Cell {label}</strong>
                <p>Drag dividers inside the modal.</p>
                {Array.from({ length: 3 }, (_, j) => (
                  <p key={j}>Content {j + 1}</p>
                ))}
              </div>
            ))}
          </SplitLayout>
        </div>
      ),
      options: {
        resizable: true,
        minimizable: true,
        minWidth: 320,
        minHeight: 280,
      },
    });
  };

  const openSyncModal = () => {
    const g = `sync-${Date.now()}`;
    addModal({
      id: `${g}-a`,
      title: `Scroll sync A`,
      content: (
        <div style={{ height: 200, overflow: "auto" }}>
          {Array.from({ length: 30 }, (_, i) => (
            <p key={i}>A line {i + 1}</p>
          ))}
        </div>
      ),
      options: { scrollSyncGroup: g, resizable: true, minimizable: true },
    });
    addModal({
      id: `${g}-b`,
      title: `Scroll sync B`,
      content: (
        <div style={{ height: 200, overflow: "auto" }}>
          {Array.from({ length: 30 }, (_, i) => (
            <p key={i}>B line {i + 1}</p>
          ))}
        </div>
      ),
      options: { scrollSyncGroup: g, resizable: true, minimizable: true },
    });
  };

  if (view === "layout") {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "8px 16px",
            display: "flex",
            gap: 8,
            alignItems: "center",
            borderBottom: "1px solid rgba(0, 180, 255, 0.4)",
            boxShadow: "0 1px 0 rgba(0, 180, 255, 0.1)",
          }}
        >
          <button type="button" onClick={() => setView("modal")}>
            ← Modal demo
          </button>
          <span>
            Split layout (drag dividers to resize, 📋/📄 copy/paste layout)
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <SplitLayout
            rows={2}
            cols={2}
            toolbarClassName="split-layout__toolbar"
            cellClassName="split-layout__cell"
          >
            {["A", "B", "C", "D"].map((label, i) => (
              <div key={i} style={{ padding: 12 }}>
                <strong>Cell {label}</strong>
                <p>Drag dividers to resize.</p>
                {Array.from({ length: 5 }, (_, j) => (
                  <p key={j}>
                    Content {label}-{j + 1}
                  </p>
                ))}
              </div>
            ))}
          </SplitLayout>
        </div>
      </div>
    );
  }

  return (
    <ModalController minimizedBarPosition="bottom" width="100vw" height="100vh">
      <div style={{ padding: 24, position: "relative", zIndex: 1, color: "#e0f4ff" }}>
        <h1 style={{ color: "#e0f4ff", textShadow: "0 0 20px rgba(0, 180, 255, 0.5)" }}>Split Viewer demo</h1>
        <p>
          Open modals and try drag, resize, minimize, ESC to close, 📋 copy
          layout, 📄 paste layout.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => openModal()}>
            Add modal (default)
          </button>
          <button
            type="button"
            onClick={() => openModal({ closeOnBackdropClick: true })}
          >
            Add modal (close on backdrop click)
          </button>
          <button type="button" onClick={openSyncModal}>
            Scroll sync (2 modals)
          </button>
          <button type="button" onClick={openModalWithSplitLayout}>
            SplitLayout in modal
          </button>
          <button type="button" onClick={() => setView("layout")}>
            Split layout demo →
          </button>
        </div>
      </div>
    </ModalController>
  );
}

export { App };
