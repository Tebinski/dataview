# CODEBASE.md

Developer-oriented map of the **DataView** codebase. For user-facing usage see
[README.md](README.md); this document covers architecture, data flow, and the
conventions to follow when extending the code.

## What it is

A small client-side **React + TypeScript** single-page app, built with **Vite**.
It loads a tab-separated `.data` file containing **several stacked tables**, lists
them in a sidebar, and plots the selected table as either a **grouped line chart**
or a **heatmap** (user's choice) using **Chart.js**, with pickers that map each
column to a visual channel.

There is no backend, no router, and no global state library — everything runs in
the browser and state lives in a single top-level component.

## Tech stack

| Concern        | Choice                                  |
| -------------- | --------------------------------------- |
| UI framework   | React 18 (`react`, `react-dom`)         |
| Language       | TypeScript 5 (strict mode)              |
| Build / dev    | Vite 5 + `@vitejs/plugin-react`         |
| Charting       | `chart.js` 4 + `react-chartjs-2` 5 + `chartjs-chart-matrix` (heatmap) |
| Deployment     | GitHub Pages via GitHub Actions         |

## Layout

```
index.html               Vite entry; mounts #root, loads src/main.tsx
vite.config.ts           Vite config — base: './' for relative asset paths
tsconfig.json            App TS config (strict, noEmit, bundler resolution)
tsconfig.node.json       TS config for the Vite config file itself
.github/workflows/
  deploy.yml             CI: build on push to main, publish dist/ to Pages
public/sample.data       Example stacked-table file (also copied to dist/)
src/
  main.tsx               ReactDOM root; renders <App> in StrictMode
  App.tsx                 Top-level state + layout; wires the pieces together
  types.ts                DataTable interface (the shared data shape)
  index.css               All styles (single stylesheet; semantic class names)
  vite-env.d.ts           Vite client type references
  lib/
    parseTables.ts        Framework-free parser for the stacked-table format
  components/
    FileLoader.tsx        "Load .data file" button + drag-and-drop
    TableList.tsx         Sidebar list of parsed tables, with filter box
    TablePlot.tsx         Line / heatmap chart with plot-type + column pickers
```

## Data model

The single shared type is [`DataTable`](src/types.ts):

```ts
interface DataTable {
  name: string        // the standalone title line preceding the table
  columns: string[]   // header names (or synthetic "col1", "col2", … )
  rows: number[][]    // numeric rows; NaN marks an unparseable cell
}
```

## Data flow

```
file (user) ──▶ FileLoader.readFile (FileReader → text)
                    │ onLoad(filename, content)
                    ▼
                  App  ── useState(content) ── useMemo ──▶ parseTables(content): DataTable[]
                    │                                            │
        ┌───────────┴───────────┐                               │
        ▼                       ▼                               │
   TableList(tables,        TablePlot(table = tables[selected]) ◀┘
   selected, onSelect)
        │ onSelect(i)
        └──▶ App.setSelected(i)
```

- [App.tsx](src/App.tsx) is the only stateful container: it holds `filename`,
  `content`, and `selected` (index). Parsing is memoized on `content`.
- Reading a new file resets `selected` to `0`.
- The selected table (`tables[selected]`) is passed to `TablePlot`; if there are
  zero tables, an explanatory empty state is shown instead.

## The `.data` file format

Tab-separated; a file is a sequence of stacked tables, each three parts:

```
TablaCore                 ← title line: a single, non-numeric cell
X    Y    TablaCore       ← header line: column names
1    1    80              ← numeric data rows until the next title line
2    1    90
```

Parsing rules, implemented in [parseTables.ts](src/lib/parseTables.ts):

- **Blank / all-empty lines** are skipped.
- A **title line** = exactly one non-empty, non-numeric cell. It starts a new
  table.
- The **first line after a title** is taken as the header, *unless* it is entirely
  numeric — in which case synthetic names (`col1`, `col2`, …) are generated and
  the line is parsed as data.
- All later lines until the next title are **data rows**; each cell is `Number(c)`,
  and empty cells become `NaN`.
- Data appearing before any title line is ignored.
- Tables may have **any number of columns** — the sample mixes 3-column
  (`X, Y, value`) and 4-column tables, handled uniformly.

## Plotting convention

[TablePlot.tsx](src/components/TablePlot.tsx) offers **two plot types**, chosen
from a dropdown, and lets the user map each column to a visual channel via
**X / Series(Y) / Value** pickers:

- **Line** — x axis = X col, one line per distinct value of the Series col,
  y = Value col. Series may be `(none)` for a single line.
- **Heatmap** — x axis = X col, y axis = Y col, **color = Value col** (rendered
  with the `chartjs-chart-matrix` plugin). Cells that repeat an (x, y) pair are
  **averaged**; a gradient colorbar shows the value range.

Defaults per table shape (number of *keys* = columns − 1):

- **3-column (2 keys)** → opens as a **line** (X col 0, Series col 1, Value last).
- **4+ column (3+ keys)** → opens as a **heatmap**, since a dense grid reads
  better as color than as many overlapping lines.

Channel choices reset to these defaults whenever the selected table changes
(a `useEffect` keyed on `table`). Rows whose x / y / value is not a finite number
are skipped, so one bad cell does not blank the chart; if nothing is plottable, a
guidance empty state is shown. Line colors come from a fixed 8-entry `PALETTE`;
heatmap colors come from a 5-stop sequential scale (`STOPS`, blue→red).

Chart.js components are explicitly registered at module load (`CategoryScale`,
`LinearScale`, `PointElement`, `LineElement`, `Tooltip`, `Legend`, `Title`,
`MatrixController`, `MatrixElement`) — add any new chart element to that
`ChartJS.register(...)` call or it will fail at runtime.

**Gotcha — scriptable options must tolerate `undefined` `raw`.** Chart.js invokes
scriptable callbacks (heatmap `backgroundColor`, tooltip `label`, etc.) once with a
*dataset-level* context where `ctx.raw` is `undefined`, before the per-cell calls.
Always guard `ctx.raw` (and `ctx.chart.chartArea`, which is undefined pre-layout);
dereferencing them unconditionally throws and unmounts the whole React tree.

## Build, run, deploy

```bash
npm install
npm run dev        # Vite dev server (HMR)
npm run build      # tsc -b (typecheck) then vite build → dist/
npm run preview    # serve the production build locally
```

- `vite.config.ts` sets `base: './'` so built asset paths are **relative** — the
  app works both at a domain root and under a GitHub Pages `/<repo>/` subpath.
- `npm run build` runs `tsc -b` first, so **type errors fail the build**.
  TypeScript is strict, including `noUnusedLocals` / `noUnusedParameters`.
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds on every
  push to `main` and publishes `dist/` to GitHub Pages (Settings → Pages →
  Source: GitHub Actions).

## Conventions for contributors

- **Keep `parseTables.ts` framework-free** — it is plain TypeScript with no React
  imports, so it stays easy to test and reuse. Put UI concerns in components.
- New UI pieces are **function components** with a local `interface Props`, a
  default export, and a short JSDoc comment describing intent.
- State stays lifted in `App.tsx`; pass data down via props and changes up via
  callbacks (`onLoad`, `onSelect`). There is no global store.
- Styling is centralized in [index.css](src/index.css) using semantic class names
  (`app`, `file-loader`, `table-list`, `plot`, …) — no CSS-in-JS.
- The shared data shape is `DataTable`; extend [types.ts](src/types.ts) rather
  than passing loosely-typed structures.

## Notes / housekeeping

- `dev-out.log` / `dev-err.log` and `file.data` / `file.data.bak` in the repo root
  are local scratch/output artifacts, not part of the app.
- `dist/` and `node_modules/` are git-ignored (see [.gitignore](.gitignore)).

