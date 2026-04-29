import { useState, useRef } from 'react'
import { importData } from '../utils/exportImport'

export default function ImportModal({ onDone, onClose }) {
  const [file, setFile] = useState(null)
  const [mode, setMode] = useState(null) // 'replace' | 'merge'
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [message, setMessage] = useState('')
  const inputRef = useRef()

  const handleFileChange = (e) => {
    const f = e.target.files[0]
    if (f && f.name.endsWith('.json')) {
      setFile(f)
      setMessage('')
    } else {
      setMessage('Please select a valid .json backup file.')
    }
  }

  const handleImport = async () => {
    if (!file) { setMessage('Please choose a file first.'); return }
    if (!mode) { setMessage('Please choose an import mode.'); return }

    setStatus('loading')
    try {
      const count = await importData(file, mode)
      setStatus('success')
      setMessage(`Successfully imported ${count} entries.`)
      setTimeout(() => onDone(), 1200)
    } catch (err) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-box bg-white rounded-2xl shadow-xl w-full max-w-sm border border-stone-100">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl text-stone-800">Import Backup</h2>
              <p className="text-sm text-stone-400 mt-0.5">Restore from a JSON export file</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* File picker */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Backup File
            </label>
            <button
              onClick={() => inputRef.current.click()}
              className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-stone-200 text-stone-500 hover:border-stone-300 hover:bg-stone-50 transition-all text-sm"
            >
              {file ? (
                <span className="text-stone-700 font-medium">{file.name}</span>
              ) : (
                <span>Click to choose a .json file</span>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Mode selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Import Mode
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setMode('merge')}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  mode === 'merge'
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="text-sm font-medium text-stone-700">Merge</div>
                <div className="text-xs text-stone-400 mt-0.5">
                  File fills missing days. Your existing entries stay.
                </div>
              </button>
              <button
                onClick={() => setMode('replace')}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  mode === 'replace'
                    ? 'border-rose-300 bg-rose-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="text-sm font-medium text-stone-700">Replace All</div>
                <div className="text-xs text-stone-400 mt-0.5">
                  Wipes current data and loads from file. Cannot be undone.
                </div>
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`text-sm px-3 py-2 rounded-lg ${
              status === 'success' ? 'bg-emerald-50 text-emerald-600' :
              status === 'error' ? 'bg-rose-50 text-rose-500' :
              'bg-stone-50 text-stone-500'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-stone-200 text-stone-500 hover:bg-stone-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={status === 'loading' || status === 'success'}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-stone-900 text-white hover:bg-stone-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Importing…' : status === 'success' ? 'Done ✓' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}
