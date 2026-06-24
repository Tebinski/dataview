import { useRef } from 'react'

interface Props {
  onLoad: (filename: string, content: string) => void
}

/** A button (plus drag-and-drop zone) that reads a chosen file as text. */
export default function FileLoader({ onLoad }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => onLoad(file.name, String(reader.result ?? ''))
    reader.readAsText(file)
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  return (
    <div
      className="file-loader"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <button type="button" onClick={() => inputRef.current?.click()}>
        Load .data file
      </button>
      <span className="hint">or drag a file here</span>
      <input
        ref={inputRef}
        type="file"
        accept=".data,.txt,.csv,.tsv,text/plain"
        onChange={onChange}
        hidden
      />
    </div>
  )
}
