export const LUNCH_COST = 90
export const MAX_DELAY = 150

export function computeMonthlySummary(data, year, month) {
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  let totalDelay = 0
  let lunchDays = 0
  let workingDays = 0
  let leaveDays = 0

  for (const [dateStr, entry] of Object.entries(data)) {
    if (!dateStr.startsWith(monthStr)) continue
    const { status, minutesLate, lunch } = entry
    if (status === 'sunday-off') continue
    if (status === 'leave') { leaveDays++; continue }
    workingDays++
    totalDelay += minutesLate || 0
    if (lunch) lunchDays++
  }

  return {
    totalDelay,
    lunchDays,
    lunchCost: lunchDays * LUNCH_COST,
    workingDays,
    leaveDays,
    delayPercent: Math.min((totalDelay / MAX_DELAY) * 100, 100),
    remaining: Math.max(MAX_DELAY - totalDelay, 0),
  }
}
