import { getTodayStr } from '../utils/dateHelpers'

export default function DayCell({ dateStr, day, entry, isSun, isOtherMonth, onClick }) {
  const today = getTodayStr()
  const isToday = dateStr === today

  if (isOtherMonth) {
    return <div className="h-24 rounded-2xl bg-transparent" />
  }

  const isSundayOff = isSun && (!entry || entry.status === 'sunday-off')
  const isSundayOT = entry?.status === 'sunday-overtime'
  const isLeave = entry?.status === 'leave'
  const isWorking = entry && (entry.status === 'working' || isSundayOT)

  let cellBg = 'bg-white border border-stone-100'
  if (isSundayOff) cellBg = 'bg-stone-50 border border-stone-100'
  if (isLeave) cellBg = 'bg-amber-50 border border-amber-100'
  if (isToday && !isSundayOff) cellBg = 'bg-blue-50 border-2 border-blue-300'

  return (
    <div
      className={`h-24 rounded-2xl p-2.5 cursor-pointer day-cell relative flex flex-col justify-between ${cellBg} ${isSundayOff ? 'cursor-default' : 'hover:shadow-md'}`}
      onClick={() => !isSundayOff && onClick(dateStr)}
    >
      {/* Date number */}
      <div className="flex items-start justify-between">
        <span className={`text-xs font-bold mono ${isToday ? 'text-blue-600' : isSundayOff ? 'text-stone-300' : 'text-stone-400'}`}>
          {String(day).padStart(2, '0')}
        </span>
        <div className="flex gap-1">
          {isSundayOT && (
            <span className="text-[9px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">OT</span>
          )}
          {isLeave && (
            <span className="text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">LEAVE</span>
          )}
        </div>
      </div>

      {/* Content */}
      {isSundayOff && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-semibold text-stone-300 tracking-widest uppercase">off</span>
        </div>
      )}

      {isLeave && entry.note && (
        <div className="flex-1 flex items-end">
          <span className="text-[10px] text-amber-500 font-medium leading-tight line-clamp-2">{entry.note}</span>
        </div>
      )}

      {isWorking && (
        <div className="flex-1 flex flex-col justify-end gap-1">
          <div className="flex items-center gap-1">
            {(entry.minutesLate || 0) === 0 ? (
              <span className="text-[11px] font-semibold text-emerald-600 mono">On time</span>
            ) : (
              <span className={`text-[11px] font-semibold mono ${entry.minutesLate >= 30 ? 'text-red-500' : 'text-amber-500'}`}>
                +{entry.minutesLate}m
              </span>
            )}
          </div>
          {entry.lunch && (
            <span className="text-[11px]">🍱</span>
          )}
        </div>
      )}

      {!entry && !isSundayOff && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-stone-200 text-lg font-light">+</span>
        </div>
      )}
    </div>
  )
}
