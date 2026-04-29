import { MONTHS } from '../utils/dateHelpers'

export default function Header({ year, month, onPrev, onNext }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900" style={{ fontFamily: 'Syne' }}>
          Office Tracker
        </h1>
        <p className="text-xs text-stone-400 mono mt-0.5">personal sign-in log</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onPrev}
          className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:bg-stone-50 hover:border-stone-300 transition-all"
        >
          ‹
        </button>
        <div className="text-center min-w-[140px]">
          <span className="text-lg font-bold text-stone-800">{MONTHS[month]}</span>
          <span className="text-lg font-bold text-stone-400 ml-2">{year}</span>
        </div>
        <button
          onClick={onNext}
          className="w-9 h-9 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:bg-stone-50 hover:border-stone-300 transition-all"
        >
          ›
        </button>
      </div>
    </div>
  )
}
