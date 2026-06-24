/** A single table parsed out of a stacked `.data` file. */
export interface DataTable {
  /** The table's name (the standalone title line that precedes it). */
  name: string
  /** Column header names, e.g. ["X", "Y", "TablaCore"] or ["ISO", "ABS", "SOMETHING", "Tablacore3"]. */
  columns: string[]
  /** Data rows, each parsed to numbers. NaN marks a cell that could not be parsed. */
  rows: number[][]
}
