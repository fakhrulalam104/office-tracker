import * as XLSX from 'xlsx'
import { isSunday } from './dateHelpers'

// ─── JSON Export ─────────────────────────────────────────────────────────────
export function exportJSON(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  triggerDownload(blob, 'office-log-backup.json')
}

// ─── CSV Export ──────────────────────────────────────────────────────────────
export function exportCSV(data) {
  const rows = [['Date', 'Day', 'Status', 'Minutes Late', 'Lunch', 'Note']]
  const sorted = Object.keys(data).sort()
  for (const dateStr of sorted) {
    const e = data[dateStr]
    const d = new Date(dateStr + 'T00:00:00')
    const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' })
    rows.push([
      dateStr,
      dayName,
      e.status || '',
      e.minutesLate ?? '',
      e.lunch ? 'Yes' : 'No',
      e.note || ''
    ])
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  triggerDownload(blob, 'office-log-export.csv')
}

// ─── Excel Export ─────────────────────────────────────────────────────────────
export function exportExcel(data) {
  const rows = [['Date', 'Day', 'Status', 'Minutes Late', 'Lunch', 'Note']]
  const sorted = Object.keys(data).sort()
  for (const dateStr of sorted) {
    const e = data[dateStr]
    const d = new Date(dateStr + 'T00:00:00')
    const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' })
    rows.push([
      dateStr,
      dayName,
      e.status || '',
      e.minutesLate ?? '',
      e.lunch ? 'Yes' : 'No',
      e.note || ''
    ])
  }
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 8 }, { wch: 30 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Office Log')
  XLSX.writeFile(wb, 'office-log-export.xlsx')
}

// ─── CSV Import ───────────────────────────────────────────────────────────────
export function parseCSV(text) {
  const lines = text.trim().split('\n')
  const result = {}
  // skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Try your original format: "DD/MM/YYYY – Weekday,Late,Lunch"
    const origMatch = line.match(/^"?(\d{2}\/\d{2}\/\d{4})\s*[–-]\s*\w+"?,(.*)$/)
    if (origMatch) {
      const [d, m, y] = origMatch[1].split('/')
      const dateStr = `${y}-${m}-${d}`
      const rest = origMatch[2]
      const parts = smartSplit(rest)
      const lateRaw = (parts[0] || '').replace(/"/g, '').trim()
      const lunchRaw = (parts[1] || '').replace(/"/g, '').trim().toLowerCase()

      if (lateRaw.toLowerCase() === 'total delay' || lateRaw.toLowerCase().includes('minutes')) continue
      if (isSunday(dateStr)) {
        result[dateStr] = { status: 'sunday-off' }
        continue
      }
      const lateNum = parseInt(lateRaw)
      if (!isNaN(lateNum)) {
        result[dateStr] = { status: 'working', minutesLate: lateNum, lunch: lunchRaw === 'yes' }
      } else if (lateRaw) {
        result[dateStr] = { status: 'leave', minutesLate: 0, lunch: false, note: lateRaw }
      }
      continue
    }

    // Standard exported format: "Date,Day,Status,Minutes Late,Lunch,Note"
    const parts = smartSplit(line)
    const dateStr = parts[0]?.replace(/"/g, '').trim()
    if (!dateStr || !dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue
    const status = parts[2]?.replace(/"/g, '').trim() || 'working'
    const lateNum = parseInt(parts[3]?.replace(/"/g, '').trim())
    const lunch = parts[4]?.replace(/"/g, '').trim().toLowerCase() === 'yes'
    const note = parts[5]?.replace(/"/g, '').trim() || ''
    result[dateStr] = { status, minutesLate: isNaN(lateNum) ? 0 : lateNum, lunch, ...(note ? { note } : {}) }
  }
  return result
}

// ─── Excel Import ─────────────────────────────────────────────────────────────
export function parseExcel(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })
  const result = {}
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0]) continue
    let dateStr = String(row[0]).trim()

    // handle DD/MM/YYYY format
    const ddmm = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
    if (ddmm) dateStr = `${ddmm[3]}-${ddmm[2]}-${ddmm[1]}`
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue

    const status = String(row[2] || 'working').trim()
    const lateNum = parseInt(row[3])
    const lunch = String(row[4] || '').trim().toLowerCase() === 'yes'
    const note = String(row[5] || '').trim()
    if (isSunday(dateStr)) {
      result[dateStr] = { status: 'sunday-off' }
      continue
    }
    result[dateStr] = { status, minutesLate: isNaN(lateNum) ? 0 : lateNum, lunch, ...(note ? { note } : {}) }
  }
  return result
}

// ─── Merge helper ─────────────────────────────────────────────────────────────
export function mergeData(existing, incoming) {
  return { ...existing, ...incoming }
}

// ─── Utils ───────────────────────────────────────────────────────────────────
function smartSplit(line) {
  const result = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { result.push(cur); cur = '' }
    else cur += ch
  }
  result.push(cur)
  return result
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
