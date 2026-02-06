# AGENT.md

## Purpose
Project memory for durable architecture and workflow notes. Keep it concise.

## Stack
- React 19 + Vite.
- Timing diagram editor with JSON import/export and SVG export.

## Key Files
- `src/App.jsx`: app shell, history, persistence, tool interaction orchestration.
- `src/components/Diagram.jsx`: SVG renderer and click hit logic.
- `src/state/defaults.js`: canonical default schema.
- `src/state/migrate.js`: JSON normalization on load/import.
- `src/state/actions.js`: pure state mutation helpers.
- `src/domain/timing/index.js`: canonical timing math (oscillator/counter).
- `src/diagram/geometry.js`: compatibility re-export for timing math.
- `src/constants/signal.js`, `src/constants/modes.js`, `src/constants/layers.js`, `src/constants/styles.js`: shared enums/options.
- `src/components/rightSidebar/*`: tool, selection, legend editors.

## State Rules
- Persisted state key: `timing_diagram_state`.
- Use `setStateAndHistory` for undo/redo-safe writes.
- `selection` shape: `{ type, ids }`.
- `layers` tracks z-order for `guides`, `zones`, `links`, `edgeArrows`, `measurements`.

## Tooling
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Tests: `pnpm test`

## Tests (Phase 0)
- `src/diagram/geometry.test.js`
- `src/state/actions.test.js`
- `src/state/migrate.test.js`
- `src/components/Diagram.smoke.test.jsx`

## Refactor Direction
- Extract timing/domain logic from UI and state orchestration.
- Replace stringly mode branching with centralized mode constants/helpers.
- Decompose `Diagram.jsx` into feature renderers.
- Build lookup maps (`signalsById`, `oscillatorsById`, `guidesById`) once per render.
