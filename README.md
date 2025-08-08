# Calendar Customizer (MVP)

A fully client-side React + TypeScript web application for designing printable photo calendars (monthly pages + yearly overview) with multi-photo layouts, basic image transforms, events, and optional common US holidays. All image processing and data persistence happen locally (IndexedDB / LocalStorage) to preserve privacy and reduce hosting costs.

## ✨ Key Goals
- 100% client-side: no backend required.
- High-quality print output (target 300 DPI export PDF / PNG).
- Simple, guided customization (sizes, layouts, photos, events, fonts).
- Offline-capable (PWA) foundation.

## ✅ MVP Feature Set (Implemented / In Progress)
- Project scaffold (Vite + React + TS + Tailwind + Zustand).
- Page size & orientation selection (5×7, Letter, A4, 11×17, 13×19).
- Multi-layout system (single, dual, triple, quad, full-bleed, etc.).
- Dark / light UI theme toggle.
- Font selection (open-license set).
- Basic PDF export (layout outlines placeholder).

## ⏳ Remaining MVP Items
- Photo upload + per-slot assignment.
- Non-destructive transforms (zoom / pan / rotate preset steps).
- Calendar grid rendering (month days + optional ISO week numbers).
- Events (add/edit/remove per date) + render in grid.
- Optional US Federal Holidays (+ New Year’s Eve) insertion on yearly overview.
- Persistence (IndexedDB blobs + project JSON; auto-save & restore).
- Caption field per month.
- Resolution warnings (optional stretch goal for MVP).

## 🧱 Future / Nice-to-Have (Post-MVP)
See `Specs.md` for full list (collage designer, sharing, cloud sync, AI assist, custom fonts upload, lunar phases, etc.).

## 🛠 Tech Stack
| Layer | Choice | Notes |
|-------|--------|-------|
| Build | Vite | Fast HMR, ESM |
| Lang | TypeScript | Strict mode |
| UI | React 18 | Functional components |
| State | Zustand + Immer | Lightweight, simple actions |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Dates | date-fns | Pure functions, tree-shakeable |
| Storage | IndexedDB (idb-keyval) + LocalStorage | Photos + project state |
| PDF | pdf-lib | Vector text & drawing |
| Image Perf | createImageBitmap / Canvas | Planned for transforms |
| PWA | Workbox (planned) | Offline shell |

## 📂 Project Structure ( evolving )
```
src/
  main.tsx            # Entry
  styles.css          # Tailwind entry
  types.ts            # Type definitions
  store/              # Zustand store & actions
  ui/                 # UI components (Sidebar, Preview, RightPanel,...)
  util/               # Helpers (layouts, pageSize, exporter,...)
  data/               # (planned) holiday datasets
Specs.md              # Full functional & technical specification
```

## 🚀 Getting Started
```bash
npm install
npm run dev
```
Visit http://localhost:5173 (default Vite port).

## 🔧 NPM Scripts
| Script | Purpose |
|--------|---------|
| dev | Start Vite dev server |
| build | Production build |
| preview | Preview production build |
| typecheck | Run TypeScript compiler w/o emit |

## ♻️ Development Workflow
1. Select a page size, orientation, and layout.
2. (Upcoming) Upload photos and assign to slots.
3. Adjust transforms and add events / holidays.
4. Export PDF for printing.

## 🧪 Testing Strategy (Planned)
- Pure functions (calendar generation, layout scaling) via unit tests (future Jest / Vitest setup).
- Visual regression (future) for export rendering.

## 💾 Persistence Plan
- IndexedDB: Photo original + preview blobs.
- JSON Project Object: Calendar settings, slots, events.
- Auto-save debounce (~1s) & manual “Reset Project”.

## 📅 Roadmap (MVP Milestones)
| Milestone | Status |
|-----------|--------|
| Scaffold & Layout Registry | Done |
| Photo Upload + Slot Assignment | Pending |
| Calendar Grid & Events | Pending |
| Holidays Toggle + Year Overview | Pending |
| Export Refinement (vector text + images) | Partial |
| Persistence + Autosave | Pending |
| PWA + Offline + Polish | Pending |

## 🔐 Privacy
All data stays local. No network transmission of images.

## 🧾 License
(Choose one – e.g., MIT) Placeholder.

## 🤝 Contributing
Internal prototype. PR guidelines TBD.

## 📄 Specification
See `Specs.md` for detailed requirements, acceptance criteria, and future scope.

---
Generated scaffold status: early MVP. Continue implementing features next.
