import { computeMonthlySummary, MAX_DELAY, LUNCH_COST } from '../utils/summary'

export default function Summary({ data, year, month }) {
  const s = computeMonthlySummary(data, year, month)

  const barColor =
    s.delayPercent >= 87 ? 'bg-red-500' :
    s.delayPercent >= 67 ? 'bg-amber-400' :
    'bg-emerald-500'

  return (
    <div className="mt-4 bg-white rounded-3xl border border-stone-100 shadow-sm p-5">
      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Monthly Summary</h3>

      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Delay */}
        <div className="bg-stone-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-stone-400 mb-1">Total Delay</p>
          <p className="text-2xl font-bold mono text-stone-900">
            {s.totalDelay}<span className="text-sm font-normal text-stone-400"> / {MAX_DELAY} min</span>
          </p>
          <div className="mt-2 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full progress-bar-inner ${barColor}`} style={{ width: `${s.delayPercent}%` }} />
          </div>
          <p className={`text-xs mono mt-1.5 font-medium ${s.remaining === 0 ? 'text-red-500' : s.remaining <= 50 ? 'text-amber-500' : 'text-stone-400'}`}>
            {s.remaining} min remaining
          </p>
        </div>

        {/* Lunch */}
        <div className="bg-stone-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-stone-400 mb-1">Lunch Cost</p>
          <p className="text-2xl font-bold mono text-stone-900">
            {s.lunchCost.toLocaleString()}<span className="text-sm font-normal text-stone-400"> ৳</span>
          </p>
          <p className="text-xs text-stone-400 mt-2 mono">{s.lunchDays} days × {LUNCH_COST} ৳</p>
          <p className="text-xs text-stone-400 mono">{s.workingDays} working days</p>
        </div>
      </div>

      {/* Status row */}
      <div className="flex gap-3 flex-wrap">
        <Chip color="emerald" label="Working" value={s.workingDays + ' days'} />
        {s.leaveDays > 0 && <Chip color="amber" label="Leave" value={s.leaveDays + ' days'} />}
        <Chip color={s.delayPercent >= 87 ? 'red' : s.delayPercent >= 67 ? 'amber' : 'stone'} label="Delay used" value={Math.round(s.delayPercent) + '%'} />
      </div>
    </div>
  )
}

function Chip({ color, label, value }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    stone: 'bg-stone-100 text-stone-600',
  }
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colors[color]}`}>
      <span className="text-stone-400 font-normal">{label}</span>
      <span className="mono">{value}</span>
    </div>
  )
}
