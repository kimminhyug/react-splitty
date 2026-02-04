# react-splitty

A React library for managing multiple viewer modals: resize, collision detection, scroll sync, and minimize.

---

## English

### Features

- **ModalController** – Manages multiple draggable/resizable modals
- **SplitLayout** – Resizable split grid (rows × cols) with copy/paste layout
- **Collision detection** – Optional overlap handling and redistribution
- **Scroll sync** – Sync scroll position across modals in a group
- **Minimize** – Minimize modals to a bar (top/bottom/left/right)

### Install

```bash
npm install react-splitty
```

Peer dependencies: `react` and `react-dom` (>=18).

### Usage

```tsx
import { ModalController, useModalStore } from "react-splitty";
import "react-splitty/dist/split-viewer.css"; // if bundled; or link the CSS from node_modules

function App() {
  const addModal = useModalStore((s) => s.addModal);

  return (
    <ModalController width="100vw" height="100vh" minimizedBarPosition="bottom">
      <button
        onClick={() =>
          addModal({
            id: "m1",
            title: "Viewer 1",
            content: <div>Content</div>,
            options: { resizable: true },
          })
        }
      >
        Open modal
      </button>
    </ModalController>
  );
}
```

### Scripts

| Command                | Description                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Run demo dev server                     |
| `npm run build`        | Build library → `dist/`                 |
| `npm run build:demo`   | Build demo static site → `dist-demo/`   |
| `npm run preview:demo` | Preview built demo (after `build:demo`) |

### Exports

- Components: `ModalController`, `ModalView`, `MinimizedBar`, `SplitLayout`
- Store: `useModalStore`
- Utils: `createScrollSync`
- Types: see `dist/index.d.ts`

---

## 한국어

### 소개

N개의 뷰어 모달을 관리하는 React 라이브러리입니다. 리사이즈, 충돌 감지, 스크롤 동기화, 최소화를 지원합니다.

### 기능

- **ModalController** – 여러 개의 드래그/리사이즈 가능한 모달 관리
- **SplitLayout** – 행×열 리사이즈 가능 스플릿 그리드, 레이아웃 복사/붙여넣기
- **충돌 감지** – 겹침 처리 및 재배치 옵션
- **스크롤 동기화** – 그룹 내 모달 간 스크롤 위치 동기화
- **최소화** – 모달을 상/하/좌/우 바로 최소화

### 설치

```bash
npm install react-splitty
```

Peer dependencies: `react`, `react-dom` (>=18).

### 사용 예

```tsx
import { ModalController, useModalStore } from "react-splitty";
import "react-splitty/dist/split-viewer.css"; // 번들에 포함하거나 node_modules에서 CSS 링크

function App() {
  const addModal = useModalStore((s) => s.addModal);

  return (
    <ModalController width="100vw" height="100vh" minimizedBarPosition="bottom">
      <button
        onClick={() =>
          addModal({
            id: "m1",
            title: "Viewer 1",
            content: <div>Content</div>,
            options: { resizable: true },
          })
        }
      >
        모달 열기
      </button>
    </ModalController>
  );
}
```

### 스크립트

| 명령어                 | 설명                                   |
| ---------------------- | -------------------------------------- |
| `npm run dev`          | 데모 개발 서버 실행                    |
| `npm run build`        | 라이브러리 빌드 → `dist/`              |
| `npm run build:demo`   | 데모 정적 사이트 빌드 → `dist-demo/`   |
| `npm run preview:demo` | 빌드된 데모 미리보기 (`build:demo` 후) |

### export

- 컴포넌트: `ModalController`, `ModalView`, `MinimizedBar`, `SplitLayout`
- 스토어: `useModalStore`
- 유틸: `createScrollSync`
- 타입: `dist/index.d.ts` 참고
