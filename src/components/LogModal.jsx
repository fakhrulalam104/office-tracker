import { useState, useEffect } from 'react'
import { formatDateLabel, isSunday } from '../utils/dateHelpers'

export default function LogModal({ dateStr, entry, onSave, onDelete, onClose }) {
  const sun = isSunday(dateStr)
  const isSundayOT = entry?.status === 'sunday-overtime'

  const [status, setStatus] = useState(() => {
    if (!entry) return sun ? 'sunday-off' : 'working'
    return entry.status || 'working'
  })
  const [minutesLate, setMinutesLate] = useState(entry?.minutesLate ?? '')
  const [lunch, setLunch] = useState(entry?.lunch ?? false)
  const [note, setNote] = useState(entry?.note ?? '')

  const showWorkFields = status === 'working' || status === 'sunday-overtime' || status === 'leave'

  function handleSave() {
    if (status === 'sunday-off') {
      onSave(dateStr, { status: 'sunday-off' })
      return
    }
    const mins = status === 'leave' ? 0 : (parseInt(minutesLate) || 0)
    onSave(dateStr, {
      status,
      minutesLate: mins,
      lunch,
      ...(note.trim() ? { note: note.trim() } : {}),
    })
  }

  // close on escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="modal-backdrop fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 border border-stone-100">

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-stone-900">Log Entry</h2>
          <p className="text-sm text-stone-400 mono mt-0.5">{formatDateLabel(dateStr)}</p>
        </div>

        {/* Sunday toggle */}
        {sun && (
          <div className="mb-5">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 block">Day Type</label>
            <div className="flex gap-2">
              {[
                { val: 'sunday-off', label: '🌿 Day Off' },
                { val: 'sunday-overtime', label: '⚡ Overtime' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setStatus(opt.val)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${status === opt.val ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Weekday status */}
        {!sun && (
          <div className="mb-5">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 block">Status</label>
            <div className="flex gap-2">
              {[
                { val: 'working', label: '✅ Working' },
                { val: 'leave', label: '🏖️ Leave' },
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setStatus(opt.val)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${status === opt.val ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Leave note */}
        {status === 'leave' && (
          <div className="mb-5">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 block">Leave Reason <span className="normal-case font-normal">(optional)</span></label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Sick leave, Adjustment leave..."
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
        )}

        {/* Minutes late — only for working/overtime */}
        {(status === 'working' || status === 'sunday-overtime') && (
          <div className="mb-5">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 block">Minutes Late</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="300"
                value={minutesLate}
                onChange={e => setMinutesLate(e.target.value)}
                placeholder="0"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-2xl font-bold mono text-stone-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium">min</span>
            </div>
            {parseInt(minutesLate) > 0 && (
              <p className="text-xs text-stone-400 mt-1.5 mono">
                {parseInt(minutesLate) >= 150 ? '🔴 At the limit!' : parseInt(minutesLate) >= 100 ? '🟡 Getting close to limit' : '🟢 Looking fine'}
              </p>
            )}
          </div>
        )}

        {/* Lunch */}
        {(status === 'working' || status === 'sunday-overtime') && (
          <div className="mb-6">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 block">Lunch Today? <span className="normal-case font-normal text-stone-400">(90 ৳)</span></label>
            <div className="flex gap-2">
              {[{ val: true, label: '🍱 Yes' }, { val: false, label: '✗ No' }].map(opt => (
                <button
                  key={String(opt.val)}
                  onClick={() => setLunch(opt.val)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${lunch === opt.val ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-semibold text-stone-500 hover:bg-stone-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-2 flex-grow-[2] py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-all">
            Save Entry
          </button>
        </div>

        {entry && (
          <button
            onClick={() => { onDelete(dateStr); onClose() }}
            className="w-full mt-2 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            Delete Entry
          </button>
        )}
      </div>
    </div>
  )
}
