import { useMemo } from 'react'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { DataTable } from '../types'

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, Title)

interface Props {
  table: DataTable
}

const PALETTE = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706',
  '#7c3aed', '#0891b2', '#db2777', '#65a30d',
]

/**
 * Plot a table as lines grouped by its 2nd column.
 *   x axis   = 1st column
 *   one line = each distinct value of the 2nd column
 *   y value  = last column
 * Tables with fewer than 3 columns fall back to a single line (1st col vs last col).
 */
export default function TablePlot({ table }: Props) {
  const data = useMemo(() => {
    const xCol = 0
    const valueCol = table.columns.length - 1
    const groupCol = table.columns.length >= 3 ? 1 : null

    const groups = new Map<string, { x: number; y: number }[]>()
    for (const row of table.rows) {
      const x = row[xCol]
      const y = row[valueCol]
      // Skip rows whose x or value isn't a real number so a single bad cell
      // doesn't blank the whole chart.
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue
      const key = groupCol === null ? table.name : String(row[groupCol])
      const points = groups.get(key) ?? []
      points.push({ x, y })
      groups.set(key, points)
    }

    const groupLabel = groupCol === null ? '' : `${table.columns[groupCol]}=`
    const datasets = [...groups.entries()].map(([key, points], i) => ({
      label: `${groupLabel}${key}`,
      data: points,
      borderColor: PALETTE[i % PALETTE.length],
      backgroundColor: PALETTE[i % PALETTE.length],
      tension: 0.15,
      pointRadius: 3,
    }))

    return { datasets }
  }, [table])

  const xTitle = table.columns[0] ?? 'X'
  const yTitle = table.columns[table.columns.length - 1] ?? 'Value'

  const pointCount = data.datasets.reduce((n, d) => n + d.data.length, 0)
  if (pointCount === 0) {
    return (
      <div className="plot-empty">
        <p>
          <strong>{table.name}</strong> has {table.rows.length} row
          {table.rows.length === 1 ? '' : 's'} but no plottable numeric points.
        </p>
        <p className="hint">
          Check that the value column ({yTitle}) contains plain numbers (e.g. <code>1.5</code>,
          not <code>1,5</code> or text).
        </p>
      </div>
    )
  }

  return (
    <div className="plot">
      <Line
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
            title: { display: true, text: table.name },
            legend: { position: 'top' },
          },
          scales: {
            x: { type: 'linear', title: { display: true, text: xTitle } },
            y: { title: { display: true, text: yTitle } },
          },
        }}
      />
    </div>
  )
}
