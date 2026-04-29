import { useRef, useState } from 'react'
import { exportJSON, exportCSV, exportExcel, parseCSV, parseExcel, mergeData } from '../utils/exportImport'

export default function ExportImport({ data, onImport }) {
  const fileRef = useRef()
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [pendingData, setPendingData] = useState(null)
  const [fileName, setFileName] = useState('')

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const ext = file.name.split('.').pop().toLowerCase()

    try {
      let parsed
      if (ext === 'json') {
        const text = await file.text()
        parsed = JSON.parse(text)
      } else if (ext === 'csv') {
        const text = await file.text()
        parsed = parseCSV(text)
      } else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer()
        parsed = parseExcel(new Uint8Array(buffer))
      } else {
        alert('Unsupported file type. Use JSON, CSV, or Excel.')
        return
      }
      setPendingData(parsed)
      setShowImport(true)
    } catch (err) {
      alert('Failed to parse file: ' + err.message)
    }
    e.target.value = ''
  }

  function confirmImport(mode) {
    if (!pendingData) return
    const result = mode === 'merge' ? mergeData(data, pendingData) : pendingData
    onImport(result)
    setPendingData(null)
    setShowImport(false)
    setFileName('')
  }

  return (
    <>
      <div className="flex gap-2 mb-6">
        {/* Export dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowExport(!showExport) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all"
          >
            ↑ Export
            <span className="text-stone-300 text-xs">▾</span>
          </button>
          {showExport && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-stone-100 rounded-2xl shadow-lg z-30 overflow-hidden min-w-[140px]">
              {[
                { label: '📄 JSON', fn: () => exportJSON(data) },
                { label: '📊 CSV', fn: () => exportCSV(data) },
                { label: '📗 Excel', fn: () => exportExcel(data) },
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => { opt.fn(); setShowExport(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 font-medium transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Import button */}
        <button
          onClick={() => fileRef.current.click()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all"
        >
          ↓ Import
        </button>
        <input ref={fileRef} type="file" accept=".json,.csv,.xlsx,.xls" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Import confirm modal */}
      {showImport && pendingData && (
        <div className="modal-backdrop fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="modal-box bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-stone-100">
            <h2 className="text-lg font-bold text-stone-900 mb-1">Import Data</h2>
            <p className="text-sm text-stone-400 mono mb-1">{fileName}</p>
            <p className="text-sm text-stone-500 mb-5">
              Found <span className="font-bold text-stone-800">{Object.keys(pendingData).length}</span> entries.
              How should this be imported?
            </p>
            <div className="flex flex-col gap-2 mb-4">
              <button
                onClick={() => confirmImport('merge')}
                className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-all text-left px-4"
              >
                <span className="block font-bold">Merge</span>
                <span className="text-xs text-stone-400">Keeps existing entries, fills in missing days</span>
              </button>
              <button
                onClick={() => confirmImport('replace')}
                className="w-full py-3 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all text-left px-4"
              >
                <span className="block font-bold">Replace All</span>
                <span className="text-xs text-red-300">Overwrites all existing data with imported file</span>
              </button>
            </div>
            <button onClick={() => { setShowImport(false); setPendingData(null) }} className="w-full py-2 rounded-xl text-sm text-stone-400 hover:text-stone-600 transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Close export dropdown on outside click */}
      {showExport && <div className="fixed inset-0 z-20" onClick={() => setShowExport(false)} />}
    </>
  )
}
