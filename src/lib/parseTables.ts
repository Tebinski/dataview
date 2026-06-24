import type { DataTable } from '../types'

/** True when the trimmed string is a finite number (e.g. "80", "-3.5", "1e3"). */
function isNumeric(s: string): boolean {
  const t = s.trim()
  return t !== '' && Number.isFinite(Number(t))
}

/** Split a raw line into trimmed cells, dropping trailing empty cells. */
function splitCells(line: string): string[] {
  const cells = line.split('\t').map((c) => c.trim())
  while (cells.length > 0 && cells[cells.length - 1] === '') cells.pop()
  return cells
}

/**
 * Parse a stacked-table `.data` file (tab separated).
 *
 * Layout repeated per table:
 *   1. a title line  — a single non-numeric cell (e.g. "TablaCore")
 *   2. a header line — the column names (e.g. "X  Y  TablaCore")
 *   3. data rows     — numeric rows until the next title line
 *
 * Tables may have any number of columns (the sample mixes 3- and 4-column tables).
 * If a table has no textual header line, synthetic names (col1, col2, …) are used.
 */
export function parseTables(content: string): DataTable[] {
  const lines = content.split(/\r?\n/)
  const tables: DataTable[] = []
  let current: DataTable | null = null
  let needHeader = false

  for (const raw of lines) {
    const cells = splitCells(raw)
    const nonEmpty = cells.filter((c) => c !== '')
    if (nonEmpty.length === 0) continue // blank / separator line

    // A title line is a single, non-numeric cell.
    const isTitle = nonEmpty.length === 1 && !isNumeric(nonEmpty[0])
    if (isTitle) {
      current = { name: nonEmpty[0], columns: [], rows: [] }
      tables.push(current)
      needHeader = true
      continue
    }

    if (!current) continue // data before any title — ignore

    // First line after a title: treat as header unless it is all numbers.
    if (needHeader) {
      needHeader = false
      const allNumeric = cells.every((c) => c === '' || isNumeric(c))
      if (!allNumeric) {
        current.columns = cells
        continue
      }
      // No header present — synthesize names and fall through to parse as data.
      current.columns = cells.map((_, i) => `col${i + 1}`)
    }

    // Data row.
    current.rows.push(cells.map((c) => (c === '' ? NaN : Number(c))))
  }

  return tables
}
