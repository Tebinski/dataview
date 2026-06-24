# DataView

A small React + TypeScript (Vite) web app that loads a tab-separated `.data` file
containing **several stacked tables**, lists them, and plots a selected one as
**lines grouped by the 2nd column**.

## File format it understands

Each table is three parts, repeated:

```
TablaCore                 <- title line: a single, non-numeric cell
X    Y    TablaCore       <- header line: the column names
1    1    80              <- numeric data rows until the next title line
2    1    90
...
```

Tables may have any number of columns — the parser handles the 3-column
(`X, Y, value`) and 4-column (`ISO, ABS, SOMETHING, value`) tables in the sample
equally. Columns are separated by **tabs**.

## Plotting

Pick a **plot type** and map columns to channels with the **X / Series / Value**
dropdowns above the chart:

- **Line** — 1st column on the x axis, one line per distinct value of the 2nd
  column, last column as the height. (Series can be set to *(none)* for one line.)
- **Heatmap** — two key columns on the x/y axes, the value column as **color**.
  Repeated cells are averaged; a colorbar shows the range.

Defaults: a 3-column `X Y Value` table opens as a **line**; a 4-column
`ISO ABS … Value` table opens as a **heatmap** (a dense grid reads better as color
than as many overlapping lines).

## Run locally

```bash
npm install
npm run dev
```

Then open the printed URL and click **Load .data file** (a `sample.data` lives in
`public/` for testing).

## Build

```bash
npm run build      # output in dist/
npm run preview    # serve the production build locally
```

## Deploy to GitHub Pages

1. Push this repo to GitHub (default branch `main`).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and publishes on
   every push to `main`.

`vite.config.ts` uses `base: './'` (relative asset paths), so it works whether the
site is served from the domain root or a `/<repo>/` subpath.

## Structure

```
src/
  lib/parseTables.ts      parsing of the stacked-table format (framework-free)
  components/
    FileLoader.tsx        load button + drag-and-drop
    TableList.tsx         sidebar list of parsed tables
    TablePlot.tsx         Chart.js line plot, grouped by 2nd column
  App.tsx                 wires it together
  types.ts                DataTable type
```
