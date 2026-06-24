import { useMemo, useState } from 'react'
import type { DataTable } from '../types'

interface Props {
  tables: DataTable[]
  selected: number
  onSelect: (index: number) => void
}

/** Sidebar listing every parsed table, with a filter box for large files. */
export default function TableList({ tables, selected, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    // Keep the original index so selection still points at the right table.
    return tables
      .map((t, i) => ({ table: t, index: i }))
      .filter(({ table }) => !q || table.name.toLowerCase().includes(q))
  }, [tables, query])

  if (tables.length === 0) return null

  return (
    <div className="table-list-wrap">
      <input
        className="table-filter"
        type="search"
        placeholder={`Filter ${tables.length} tables…`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="table-list">
        {matches.map(({ table, index }) => (
          <li key={index}>
            <button
              type="button"
              className={index === selected ? 'active' : ''}
              onClick={() => onSelect(index)}
            >
              <span className="table-name">{table.name}</span>
              <span className="table-meta">
                {table.columns.length} cols · {table.rows.length} rows
              </span>
            </button>
          </li>
        ))}
        {matches.length === 0 && <li className="no-match">No tables match “{query}”.</li>}
      </ul>
    </div>
  )
}
