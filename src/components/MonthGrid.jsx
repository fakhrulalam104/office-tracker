import { DAYS_SHORT, getDaysInMonth, getFirstDayOfMonth, toDateStr, isSunday } from '../utils/dateHelpers'
import DayCell from './DayCell'

export default function MonthGrid({ year, month, data, onDayClick }) {
  const totalDays = getDaysInMonth(year, month)
  const startOffset = getFirstDayOfMonth(year, month) // 0=Mon, 6=Sun

  const cells = []

  // Leading empty cells
  for (let i = 0; i < startOffset; i++) {
    cells.push(<DayCell key={`empty-${i}`} isOtherMonth={true} />)
  }

  // Actual days
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = toDateStr(year, month, d)
    const sun = isSunday(dateStr)
    const entry = data[dateStr] || null
    cells.push(
      <DayCell
        key={dateStr}
        dateStr={dateStr}
        day={d}
        entry={entry}
        isSun={sun}
        isOtherMonth={false}
        onClick={onDayClick}
      />
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-stone-100 p-5 shadow-sm">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-3">
        {DAYS_SHORT.map(d => (
          <div key={d} className={`text-center text-[11px] font-bold tracking-widest uppercase py-1 ${d === 'Sun' ? 'text-rose-300' : 'text-stone-400'}`}>
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-2">
        {cells}
      </div>
    </div>
  )
}
