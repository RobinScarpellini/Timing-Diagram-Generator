# AGENT.md

## Purpose
Persistent project memory for future edits. Keep this file focused on durable architecture and workflow details.

## Project Summary
- React + Vite single-page app to build timing diagrams.
- Primary signal types: `oscillator`, `counter`.
- Overlays/tools: guides, zones, links, bold edges, edge arrows, measurements, legend.
- Main outputs: JSON config save/load and SVG export.

## Run Commands
- `npm run dev`: start local dev server.
- `npm run build`: production build.
- `npm run lint`: ESLint checks.

## Codebase Map
- `src/App.jsx`: top-level orchestration (state, history, save/load, zoom, tool flows).
- `src/state/defaults.js`: canonical default state schema.
- `src/state/migrate.js`: `normalizeState` for imported/persisted JSON compatibility.
- `src/state/actions.js`: pure update helpers (add/update/remove signals and dependencies).
- `src/components/Diagram.jsx`: SVG rendering + hit areas + mode-dependent interactions.
- `src/components/SignalsPanel.jsx`: signal cards, per-signal settings, drag reorder.
- `src/components/RightSidebar.jsx`: right panel tab logic + batch patching.
- `src/components/rightSidebar/*`: tool/selection/legend editors.
- `src/diagram/geometry.js`: oscillator/counter edge timing math.
- `src/diagram/legend.js`: legend sizing/positioning helpers.
- `src/App.css`: global layout, panel sizing, toolbar/sidebar/canvas styling.

## State Model Rules
- App state is centralized in `App.jsx` and applied via reducer `dispatch({ type: 'set', state })`.
- Use `setStateAndHistory(...)` for changes that must support undo/redo and localStorage persistence.
- `layers` (`guides`, `zones`, `links`, `edgeArrows`, `measurements`) defines per-type z-order.
- `selection` format is `{ type, ids }`; tooling and sidebar rely on this shape.
- `settings` is global style/config source. Element-level style can override global values.

## Persistence + IO
- Main local storage key: `timing_diagram_state`.
- Panel width local storage keys:
- `timing_diagram_ui_left_panel_width`
- `timing_diagram_ui_right_panel_width`
- Save/load JSON is normalized through `normalizeState`.
- SVG export serializes the current `.diagram-canvas svg`.

## Editing Guidelines
- When adding a new state field:
- Add default in `src/state/defaults.js`.
- Add migration handling in `src/state/migrate.js`.
- Thread through sidebar/editor UI and diagram renderer as needed.
- For new drawable entities, also update:
- Removal dependency logic in `src/state/actions.js`.
- Layer ordering support in `layers`.
- Selection patch/remove handling.
- Keep render calculations deterministic and avoid unnecessary repeated lookups in hot loops.
- Reuse shared input/editor components (`NumberField`, `SelectField`, `TextField`, `SharedEditors`) for consistency.

## Interaction Model Notes
- `creationMode` drives what clicks do (create/delete/select/copy/paste/measure).
- `cursorFilter` narrows click targets by entity type while preserving selection behavior.
- Tool actions for edge clicks are routed through `toggleBoldEdge(...)` in `App.jsx`.
- Sidebar tool tab is forced when a creation tool is active.

## Performance/Regression Hotspots
- `Diagram.jsx` edge rendering can become heavy with very small periods and large durations.
- Counter edge time resolution loops across a computed range in `geometry.js`; avoid unbounded expansions.
- Layout overflow/scroll behavior is sensitive to `App.css` changes in:
- `.canvas-stage`, `.diagram-canvas`, `.right-sidebar-*`, `.legend-*`.

## Pre-PR/Pre-Commit Checklist
- Run `npm run build`.
- Validate at least:
- Add/edit/remove oscillator and counter.
- Create/delete each overlay type.
- Save JSON -> load JSON roundtrip.
- Undo/redo after multi-step edits.
- Zoom controls and zoom-to-fit behavior.
