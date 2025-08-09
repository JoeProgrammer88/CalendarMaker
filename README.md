# Calendar Customizer

A fully client-side React + TypeScript web application for designing printable photo calendars (cover + monthly pages + yearly overview) with multi-photo layouts, image transforms, events, and optional common US holidays. All image processing and data persistence happen locally (IndexedDB / LocalStorage) to preserve privacy and reduce hosting costs.

## ✨ Key Goals
- 100% client-side: no backend required.
- High-quality print output (target 300 DPI export PDF / PNG).
- Simple, guided customization (sizes, layouts, photos, events, fonts).
- Offline-capable (PWA) foundation.

## ✅ Current Feature Set
- Project scaffold (Vite + React + TS + Tailwind + Zustand).
- Page sizes & orientation (5×7, Letter, A4, 11×17, 13×19).
- Split toggle: Top/Bottom vs Left/Right; selecting L/R auto-switches to 5×7 Landscape.
- Multi-layout system (single, dual, triple, quad, full-bleed) with LR variants; dual/triple TB use exact 50% photo/50% grid.
- Photo upload library, thumbnails, per-slot assignment.
- Non-destructive transforms per slot (zoom, pan, rotate, reset).
- Calendar grid with month label inside the header, optional ISO week numbers.
- Events: add/edit/delete via modal (double‑click a day), visibility toggle; render in grid.
- Caption per month (preview + export).
- Yearly Overview page (optional) with mini-month grids; basic US holiday highlights.
- Cover page (optional): Large Photo (90% photo) or 4×3 Month Grid (12 thumbnails), both with a 10% date range footer.
- PDF export: vector text (standard fonts), photos at ~300 DPI, precise grid lines (no header underline), shaded header background, progress indicator.
- Dark / light UI theme toggle.

## ⏳ In Progress / Remaining
- PDF font embedding/subsetting to match selected UI fonts.
- Persistence: IndexedDB blobs + project JSON; autosave/restore; migrations.
- Expanded holiday dataset and cross‑year handling (overview).
- Resolution warnings for low‑res images (stretch).
- Export progress UI polish (modal with cancel).
- Accessibility polish (ARIA/focus, keyboard shortcuts).
- PWA: service worker, manifest, offline shell.

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

## 📂 Project Structure
```
src/
  main.tsx            # Entry
  styles.css          # Tailwind entry
  types.ts            # Type definitions
  store/              # Zustand store & actions
  ui/                 # UI components (Sidebar, Preview, RightPanel,...)
  util/               # Helpers (layouts, pageSize, exporter,...)
  data/               # (planned) holiday datasets
Specs.md              # Full functional & technical specification (kept up to date)
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
1. Select a page size, orientation, and layout (use Split toggle for TB/LR).
2. Upload photos and assign to slots; adjust transforms.
3. Add captions and events; toggle week numbers or Overview holidays if desired.
4. Optional: Include a Cover page and choose the style.
5. Export multi-page PDF for printing.

## 🧪 Testing Strategy (Planned)
- Pure functions (calendar generation, layout scaling) via unit tests (future Jest / Vitest setup).
- Visual regression (future) for export rendering.

## 💾 Persistence Plan
- IndexedDB: Photo original + preview blobs.
- JSON Project Object: Calendar settings, slots, events.
- Auto-save debounce (~1s) & manual “Reset Project”.

## 📅 Roadmap (Milestones)
| Milestone | Status |
|-----------|--------|
| Scaffold & Layout Registry | Done |
| Photo Upload + Slot Assignment | Done |
| Calendar Grid & Events | Done |
| Split Toggle + LR Variants | Done |
| Cover Page Options | Done |
| Holidays Toggle + Year Overview | Done (basic set) |
| Export Refinement (fonts embedding) | In Progress |
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
