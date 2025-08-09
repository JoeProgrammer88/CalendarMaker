# Calendar Customizer Web App – Functional & Technical Specification

## 1. Vision / Goal
Provide a fully client‑side (no backend service required) web application that lets a user design and print a personalized monthly or yearly photo calendar. Users pick a calendar format (size, layout style, start month/year), customize per‑month photos (upload, crop, zoom, reposition), optionally add captions / birthdays / events, and export high‑resolution printable pages (PNG / PDF) compatible with standard home printers.

## 2. Primary Personas
| Persona | Goals | Pain Points Addressed |
|---------|-------|-----------------------|
| Casual Home User | Make a quick custom gift calendar | Doesn’t want to learn complex design tools |
| Parent / Hobbyist Photographer | Showcase family/event photos nicely | Needs control over crop/placement without Photoshop |
| Small Club / School Volunteer | Add events/reminders to shared calendar | Needs simple event entry, local privacy |

## 3. Key Value Propositions
1. 100% in-browser; no photo leaves the user’s device (privacy & cost).  
2. Fast, guided workflow from template selection to export.  
3. High-quality print output (300 DPI) without installing software.  
4. Lightweight and offline-capable (PWA).  

## 4. Scope
### In Scope (MVP)
- Calendar types: Monthly (12 pages) + Cover; Single-Year overview (optional toggle).  
  - Cover page styles: Large Photo (image occupies ~90% of page with a ~10% date-range footer) or 4×3 Photo Grid (12 month thumbnails) with a ~10% footer.  
- Page sizes: 5"×7" (portrait & landscape), US Letter (8.5"×11") portrait & landscape, A4, 11"×17" (tabloid) portrait & landscape, 13"×19" (Super B) landscape (portrait if feasible).  
  - UX rule: Selecting 5×7 defaults orientation to Landscape and applies a left/right split layout (photo left, calendar right).  
  - Split rule: Left/Right split is available on 5×7 Landscape; choosing L/R elsewhere auto-switches to 5×7 Landscape.  
- Layout styles (initial set):
  - Single Photo Top + Grid Bottom
  - Single Photo Left + Grid Right
  - Full-bleed Single Photo with overlay month header
  - Dual Photo Split (top/bottom or left/right)
  - Triple Photo Strip (one large + two small) 
  - Quad Photo Grid (2×2 collage)
  - Mosaic (asymmetric collage) [stretch inside MVP if time]
  - Proportions rule: Dual and Triple Top/Bottom variants allocate exactly 50% page height to photos and 50% to the grid. Left/Right variants allocate 50% width to photos (left) and 50% to the grid (right).  
- Start month & year selection (e.g., start at July 2025).  
- Photo upload (drag & drop, file picker, multiple files).  
- Per-month photo assignment / reuse (multiple slots where layout supports).  
- Photo edit tools: zoom (scale), pan (x/y translate), rotate (0°, 90°, 180°, 270°), optional free rotation (future), reset (per slot).  
- Non-destructive crop (store transform matrix only per slot).  
- Add simple text caption under photo area (multi-photo layouts: shared caption).  
- Event/holiday entry (simple: date + short text) stored locally.  
- Optional toggle: show common holidays (initial limited US federal set + New Year’s Eve) on yearly overview (may be downgraded to stretch if time).  
- Option to show week numbers (ISO).  
- Month label displayed above each monthly grid (preview and export).  
- Localization: month & weekday names (English only MVP, extensible).  
- Light/Dark theme for UI (not print).  
- Export per page as PNG and whole calendar as multi-page PDF (vector text).  
- Persist project state locally (LocalStorage / IndexedDB) with manual save & auto-save.  
- Reset / new project flow with confirmation.  
- Basic accessibility (keyboard nav for controls, alt text field for image/caption).  
- Font selection (limited built-in set: Sans (Inter), Serif (Merriweather), Script (Dancing Script), Display (Oswald), Mono (optional) – all open license).  

### Future / Nice-to-Have (Not MVP)
- Additional custom paper sizes & bleed/crop mark configuration.  
- Advanced collage designer (arbitrary drag-resizable slots).  
- Background patterns & color themes beyond base set.  
- Expanded holiday presets by locale / region & selectable sets.  
- Sharing editable project via URL (would require backend or encrypted data blob).  
- Cloud sync / login.  
- AI auto-crop / best photo selection.  
- Spellcheck for captions (browser native).  
- Bulk import events (CSV).  
- Support for lunar phases.  
- User-uploaded custom fonts (font subset pipeline).  

## 5. User Stories
### Core
1. As a user I can choose calendar size & orientation so that printouts match my paper.  
2. As a user I can select a start month & year so I can create academic calendars.  
3. As a user I can upload multiple photos and assign each to a month so I can personalize pages.  
4. As a user I can zoom and move a photo inside its frame so important subjects are visible.  
5. As a user I can add text events to specific dates so birthdays appear on the calendar.  
6. As a user I can export all pages as a high-resolution PDF for printing.  
7. As a user I can return later and continue editing my saved calendar.  
8. As a user I can reset all edits if I want to start over.  
9. As a user I can toggle week numbers in the grid.  
10. As a user I can add a caption under the monthly photo area.  
11. As a user I can pick a multi-photo layout for a month to showcase multiple images.  
12. As a user I can toggle display of common holidays on the yearly overview.  
13. As a user I can select from several font styles to match my aesthetic.  

### Secondary
14. As a user I can duplicate settings from one month to another.  
15. As a user I can hide an event without deleting it.  
16. As a user I can reorder uploaded photos within a media library.  
17. As a user I can swap a specific photo slot’s image without affecting other slots.  

## 6. Functional Requirements
### 6.1 Calendar Generation
- Generate month grid given year, month, locale (needs: first weekday = Sunday/Monday toggle future).  
- Include leading/trailing days (toggle) or leave blanks; MVP: blanks.  
- Optionally compute ISO week numbers (algorithmic, client).  
- Header bar: Draw a shaded header background above the weekday row and center the month/year label within it (preview + export).  
- Gridlines: Omit the horizontal gridline directly under the header bar; preserve the top line of the first week row. Vertical gridlines start below the header bar.  
- Yearly overview page supports optional injection of common holidays (data file).  

### 6.2 Photo Handling
- Accept JPG, PNG, WebP (MVP) up to e.g. 25 MB each (config).  
- Create downscaled preview for UI (e.g. max 1600px longest edge) but keep original in memory/IndexedDB for final render quality.  
- Maintain per-slot transform: {scale, translateX, translateY, rotationDegrees}.  
- Use offscreen canvas / createImageBitmap for performance.  
- Support multiple photo slots defined by layout (each slot has normalized rect).  

### 6.3 Editing UI
- Layout: Left sidebar (Project / Photos / Events / Layouts / Fonts), central canvas preview (page), right properties panel (contextual).  
 - Split toggle: Top/Bottom vs Left/Right; L/R places photos on the left and the calendar grid on the right, and auto-switches to 5×7 Landscape if needed.  
 - Cover controls: "Include Cover Page" toggle and "Cover Style" selector (Large Photo or 4×3 Month Grid).  
- Slot selection: clicking a photo slot highlights it; transforms apply to active slot.  
- Font picker: radio/list with preview swatches + fallback.  
- Keyboard: arrow keys nudge photo (1px), Shift+arrow (10px), +/- or wheel for zoom (active slot).  
- Undo/Redo stack (limit e.g. 50) covers slot changes individually and font changes.  

### 6.4 Events / Holidays
- Data model: {id, dateISO (YYYY-MM-DD), text, color?, visible}.  
- Render event text in day cell (truncate + tooltip on hover).  
- Limit lines per cell (1–2) with ellipsis.  
- Common holidays dataset (JSON) loaded lazily; only dates added if toggle enabled; user can remove or hide.  

### 6.5 Export
- High DPI target: 300 DPI at physical size. Calculation examples: 5"×7" → 1500×2100 px; 11"×17" → 3300×5100 px; 13"×19" → 3900×5700 px.  
- Rendering approach: For each page, draw via HTML <canvas> or SVG→Canvas:  
  1. Create canvas sized to required pixels.  
  2. Draw background, each photo slot (apply transforms individually), grid lines (vector drawn), text.  
  3. Export canvas.toDataURL("image/png") or assemble multi-page PDF (vector text).  
- Outline fonts or embed subset fonts (license-compliant) to keep file size small.  
- Header and grid rules (export parity with preview): Shaded header bar with centered month/year label; no gridline directly under the header; vertical gridlines start below the header; top line of the first week row is present.  
- Cover page rendering: Large Photo style uses ~90% image area with ~10% date-range footer; 4×3 grid style compiles 12 month thumbnails with ~10% footer. Cover precedes monthly pages.  
- Provide progress indicator for multi-page export.  

### 6.6 Persistence
- Project state JSON structure (versioned):
```
Project {
  id: string,
  meta: { createdAt, updatedAt, appVersion },
  calendar: { startMonth, startYear, months: 12|custom, layoutStylePerMonth: [layoutId], pageSize, orientation, showWeekNumbers, showCommonHolidays, fontFamily },
  photos: [ Photo { id, originalBlobRef, previewBlobRef?, name, exif?, assignedMonths: [index...] } ],
  monthData: [ MonthPage { index, slots: [ { slotId, photoId, transform } ], caption, events: [eventId...] } ],
  events: [ Event ],
}
```
- Storage: IndexedDB for blobs + project JSON; LocalStorage for lastOpenedProjectId.  
- Migration layer if schema version increases (legacy single-photo month converts to slots[0]).  

### 6.7 Offline & PWA
- Service Worker caching static assets (App Shell).  
- Runtime caching for font & library CDNs (with stale-while-revalidate).  
- Manifest for installable experience.  

### 6.8 Accessibility & Internationalization (MVP subset)
- ARIA labels on interactive canvas controls & font picker.  
- Focus indication for selected photo slot.  
- Color contrast AA for UI.  
- Alt text input for each photo (applies across slots using that photo).  
- English only; architecture supports locale pack JSON.  

### 6.9 Performance Targets
- Initial load (cold) < 3s on mid-tier laptop.  
- Memory: Avoid keeping > original + preview duplicates unnecessarily (release imageBitmaps when not active).  
- Export: 13 pages (cover + 12 months) under 20s on mid-tier device (single-photo baseline; multi-photo adds <20% overhead).  

### 6.10 Security & Privacy
- No network upload of images (enforce by not sending fetch with blobs).  
- CSP to disallow unexpected outbound requests except known (fonts).  
- Clear data option (delete project & blobs).  

## 7. Non-Functional Requirements
| Category | Requirement |
|----------|------------|
| Availability | Works offline after first load |
| Reliability | Autosave debounced (e.g., 1s) to prevent data loss |
| Maintainability | Modular architecture with type definitions; feature flags for future options |
| Extensibility | Layout system pluggable; new templates registered via config objects (multi-slot capable) |
| Usability | Onboarding tooltips for first project |
| Portability | Latest stable Chrome, Edge, Safari (desktop & mobile); responsive tablet layout |
| Performance | Meets section 6.9 targets |

## 8. Technology Stack (Proposed)
- Framework: React + TypeScript (component-oriented, state mgmt).  
- State Management: Zustand or Redux Toolkit (simple undo/redo).  
- Canvas Rendering: Native Canvas 2D; optional Fabric.js (evaluate overhead) – MVP: custom minimal utilities.  
- PDF Generation: pdf-lib (vector text + embedded images) OR jsPDF (compare quality).  
- Image Processing: createImageBitmap, OffscreenCanvas (where available), fallback to standard Canvas.  
- Storage: idb-keyval or custom IndexedDB wrapper for blobs + JSON.  
- PWA: Workbox for service worker generation.  
- Styling: Tailwind CSS (rapid prototyping) or CSS Modules.  
- Date Utilities: date-fns (tree-shakeable).  
- Holiday Dataset: Static JSON (US Federal minimal + New Year’s Eve).  
- Fonts: Pre-bundled or Google Fonts (Inter, Merriweather, Dancing Script, Oswald, optional JetBrains Mono) with local caching & subset.  

## 9. Architecture Overview
Layered approach:
1. UI Layer (React Components)
2. State Layer (store + actions + selectors)
3. Rendering Engine (pure functions to render page to canvas/PDF given state snapshot)
4. Persistence Layer (serialize/deserialize, migrations)
5. Service Worker (caching strategies)
6. Utility Modules (date generation, image loading, DPI calculations)
7. Data Assets (holidays dataset)

Data Flow Example:
User action (zoom photo slot) -> Store action updates slot transform -> Preview Canvas re-renders that slot layer -> Export uses same pure render pipeline at higher resolution.

## 10. Core Modules
- calendar-generator.ts: builds month matrix / week numbers.  
- layout-registry.ts: defines layout frames (array of photo slot rects + grid rect) in normalized units for each style/orientation.  
- render-page.ts: given page spec + state => renders to canvas context (params: resolution, include bleed?).  
- export-service.ts: orchestrates multi-page PDF/PNG export with progress callbacks & cancellation token.  
- image-store.ts: load, cache, create previews, release.  
- persistence.ts: save/load/migrate project.  
- undo-redo.ts: history manager (command pattern or state snapshots diff).  
- events-manager.ts: CRUD for events & linking to months.  
- holidays-service.ts: provides common holiday list (filtered by year).  

## 11. Layout System
Each layout style: {
  id: string,
  name: string,
  supportedOrientations: ["portrait"|"landscape"],
  slots: [ { slotId: string, rect: { x, y, w, h } } ], // photo slots (>=1)
  grid: { x, y, w, h },
  options: { allowCaptionBelowPhotoArea?: boolean }
}
Rendering scales rects to pixel canvas size.  

- SplitDirection & variants: When SplitDirection is Left/Right and the page size is 5×7 Landscape, left/right variants are used (photos confined to left 50%, grid on right 50%). Otherwise Top/Bottom variants apply (photos above, grid below). UI hides LR-specific variants from the layout picker and maps automatically based on SplitDirection.

## 12. DPI & Scaling Strategy
- Internal logical page uses 0..widthPx coordinates (widthPx = DPI * widthInches).  
- Preview canvas may use reduced DPI (e.g. 100) for performance; export uses 300.  
- Photo transforms stored independent of DPI (percent coordinates relative to slot rect).  

## 13. Export Quality Considerations
- Use image smoothing quality = high.  
- If photo source smaller than needed at 300 DPI -> warn user (resolution indicator per slot).  
- Embed ICC color profile? (Out of scope MVP).  

## 14. Error Handling
- Graceful fallback if image fails to decode (show placeholder).  
- Catch & display export errors with retry.  
- Detect storage quota exceeded (IndexedDB errors) -> prompt user to remove large photos.  

## 15. Telemetry (Optional / Off by default for privacy)
- If enabled (user opt-in), minimal anonymous events: feature usage counts (no photo data).  

## 16. Open Questions 

## 17. Acceptance Criteria (MVP Excerpts)
1. Uploading a 10MB JPG does not freeze UI more than 1s (decode off main thread if possible).  
2. Exported PDF prints with crisp text (no rasterized blur at 300 DPI).  
3. Refreshing the page restores the last auto-saved project state.  
4. Removing a photo unassigns it gracefully from any months (slots referencing removed photo become empty).  
5. Week numbers toggle affects all pages within <250ms.  
6. Undo (Ctrl+Z) after zooming a photo slot returns previous zoom.  
7. All logic works offline after first load (airplane mode test).  
8. Switching a month layout from single to multi-photo preserves existing first photo in slot[0].  
9. Enabling common holidays populates yearly overview within <150ms.  
10. Changing font updates preview within <150ms and export uses selected font.  

## 18. Milestones
1. Foundation: Project scaffold, layout registry (single + multi-slot), calendar generator (Week 1). [Done]
2. Photo Upload & Multi-Slot Transform Preview (Week 2). [Done]
3. Events, Holidays Toggle & Grid Rendering (Week 3). [In Progress]
  - Done: Month grid rendering; Events CRUD UI via double‑click on day (modal), render events in day cells (truncate), ISO week numbers toggle.
  - Pending: Holidays toggle and dataset injection.
4. Export (PNG then PDF) (Week 4). [In Progress]
  - Done: PDF month/year label; calendar grid with day numbers, ISO week numbers; events (with color); caption above grid; photos rendered in slots with transforms at 300 DPI; export progress indicator.
  - Pending: Embed selected fonts for vector text (match UI fonts), progress dialog polish.
5. Persistence + Undo/Redo + Layout switching migrations (Week 5). [Pending]
6. PWA + Polish + Accessibility & QA (Week 6). [Pending]

## 19. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Large images cause memory spikes | Crash / slow | Downscale previews, release bitmaps, warn user |
| PDF text rendered as raster | Loss of quality | Use pdf-lib with vector text API |
| IndexedDB quota errors | Save failure | Estimate usage, proactive size checks |
| Performance on low-end devices | Poor UX | Progressive preview quality, worker offload |
| Complexity creep (features) | Delays | Enforce MVP scope lock |
| Multi-photo layout increases export time | User waiting | Parallel slot rendering, caching scaled bitmaps |

## 20. Glossary
- DPI: Dots per Inch; printing resolution.  
- Layout Style: Predefined arrangement of photo & calendar grid areas; now may include multiple photo slots.  
- Non-destructive Crop: Transform stored separately; original image unchanged.  
- Slot: An individual photo placement rectangle within a layout.  
- Font Subsetting: Including only required glyphs to reduce file size.  

## 21. Current Implementation Status (as of 2025-08-08)

- Completed
  - Project scaffold (Vite + React + TypeScript + Tailwind + Zustand)
  - Layout registry with multi-photo templates (single, dual, triple, quad, full-bleed)
  - Page size & orientation selection (5×7, Letter, A4, 11×17, 13×19)
  - Light/Dark UI theme toggle
  - Font selection UI (wired to state)
  - Photo upload library, thumbnails, per-slot assignment
  - Non-destructive transforms UI per slot (zoom, pan, rotate, reset)
  - Month grid generation and preview rendering
  - Events CRUD via modal; double‑click on day to add/edit; visibility toggle; tooltips for truncated events in preview
  - ISO week numbers toggle (preview + export)
  - Caption per month (preview + export)
  - PDF export: real grid with day numbers, events (colors), caption, photos rendered at 300 DPI per slot
  - Export progress indicator (button label + progress bar)
  - Shaded header bar with centered month/year label; no gridline directly under header; top line of the first week row preserved (preview + export parity)
  - Cover page: Large Photo (≈90% image + 10% footer) and 4×3 month grid options (precede monthly pages)
  - Yearly Overview page (optional toggle) with mini-month grids; basic fixed-date US holidays highlight when enabled
  - Split toggle with auto-switch to 5×7 Landscape; multi-photo layouts use columns for 2/3 photos and 2×2 uses half-page as specified
  - Dual/Triple Top/Bottom variants are exactly 50% photo area / 50% grid; Left/Right variants constrain photos to left 50% and grid to right 50%
  - Preview polish: eliminated header/photo overlap in 5×7 Landscape by precise header background sizing

- Underway
  - PDF font embedding/subsetting to match selected UI font
  - Yearly Overview: expand holiday dataset (and handle cross-year spans)

- Pending
  - Persistence: IndexedDB for blobs + project JSON; autosave/restore; migrations
  - Caption export typography polish (centering, font style)
  - Resolution warnings for low-res images (stretch goal)
  - Accessibility polish (ARIA, focus), keyboard shortcuts
  - PWA: service worker, manifest, offline shell

- How to resume next time
  1) Embed selected fonts for vector text in PDF (Inter, Merriweather, etc.)
  2) Add an export progress modal with cancel
  3) Implement persistence (IndexedDB + autosave/restore) and migrations
  4) Expand yearly overview holiday dataset and handle cross-year spans

---
End of Specification.
