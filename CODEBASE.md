# CODEBASE.md

Developer-oriented map of the **DataView** codebase. For user-facing usage see
[README.md](README.md); this document covers architecture, data flow, and the
conventions to follow when extending the code.

## What it is

A small client-side **React + TypeScript** single-page app, built with **Vite**.
It loads a tab-separated `.data` file containing **several stacked tables**, lists
them in a sidebar, and plots the selected table as **lines grouped by the 2nd
column** using **Chart.js**.

There is no backend, no router, and no global state library — everything runs in
the browser and state lives in a single top-level component.

## Tech stack

| Concern        | Choice                                  |
| -------------- | --------------------------------------- |
| UI framework   | React 18 (`react`, `react-dom`)         |
| Language       | TypeScript 5 (strict mode)              |
| Build / dev    | Vite 5 + `@vitejs/plugin-react`         |
| Charting       | `chart.js` 4 + `react-chartjs-2` 5      |
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
  index.css               All styles (single stylesheet, ~104 lines)
  vite-env.d.ts           Vite client type references
  lib/
    parseTables.ts        Framework-free parser for the stacked-table format
  components/
    FileLoader.tsx        "Load .data file" button + drag-and-drop
    TableList.tsx         Sidebar list of parsed tables, with filter box
    TablePlot.tsx         Chart.js line plot, grouped by the 2nd column
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

[TablePlot.tsx](src/components/TablePlot.tsx) maps columns to the chart like so:

- **x axis** = 1st column (`columns[0]`)
- **one line per distinct value** of the 2nd column (the grouping column)
- **y value** = last column (`columns[length-1]`)
- Tables with **fewer than 3 columns** fall back to a single line (1st vs last).
- Rows whose x or y is not a finite number are skipped, so one bad cell does not
  blank the chart; if nothing is plottable, a guidance empty state is shown.
- Colors come from a fixed 8-entry `PALETTE`, cycled by group index.

Chart.js components are explicitly registered at module load (`LinearScale`,
`PointElement`, `LineElement`, `Tooltip`, `Legend`, `Title`) — add any new chart
element to that `ChartJS.register(...)` call or it will fail at runtime.

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
- On a case-insensitive filesystem (Windows/macOS default) `CODEBASE.md` and
  `codebase.md` resolve to **this same file**.
