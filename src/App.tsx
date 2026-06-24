import { useMemo, useState } from 'react'
import FileLoader from './components/FileLoader'
import TableList from './components/TableList'
import TablePlot from './components/TablePlot'
import { parseTables } from './lib/parseTables'

export default function App() {
  const [filename, setFilename] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [selected, setSelected] = useState(0)

  const tables = useMemo(() => (content ? parseTables(content) : []), [content])

  function handleLoad(name: string, text: string) {
    setFilename(name)
    setContent(text)
    setSelected(0)
  }

  const current = tables[selected]

  return (
    <div className="app">
      <header>
        <h1>DataView</h1>
        <FileLoader onLoad={handleLoad} />
        {filename && (
          <span className="filename">
            {filename} — {tables.length} table{tables.length === 1 ? '' : 's'}
          </span>
        )}
      </header>

      <div className="body">
        <aside>
          <TableList tables={tables} selected={selected} onSelect={setSelected} />
        </aside>
        <main>
          {current ? (
            <TablePlot table={current} />
          ) : content ? (
            <p className="empty">
              Loaded <code>{filename}</code> but found <strong>0 tables</strong>. Expected
              tab-separated tables, each starting with a name line then a header row.
            </p>
          ) : (
            <p className="empty">Load a <code>.data</code> file to see its tables.</p>
          )}
        </main>
      </div>
    </div>
  )
}
