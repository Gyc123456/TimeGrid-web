import { DAY, daysBetween, iso, stamp, timelineDates, validRange } from './schedule.ts'

export type TimelineScale = 'month' | 'year'

export interface TimelineColumn {
  date: string
  end: string
  label: string
  caption: string
  weekend: boolean
}

export function fitTimelineColumnWidth(
  availableWidth: number,
  columnCount: number,
  minimumWidth = 60,
) {
  // Fill available space while keeping columns readable on smaller screens.
  return columnCount > 0 ? Math.max(minimumWidth, availableWidth / columnCount) : minimumWidth
}

export function calendarRange(value: string, scale: TimelineScale) {
  if (scale === 'year') {
    if (!/^\d{4}$/.test(value)) return null
    const start = `${value}-01-01`
    const end = `${value}-12-31`
    return validRange(start, end) ? { start, end } : null
  }
  if (!/^\d{4}-\d{2}$/.test(value)) return null
  const start = `${value}-01`
  if (!validRange(start, start)) return null
  const last = new Date(stamp(start))
  last.setUTCMonth(last.getUTCMonth() + 1, 0)
  return { start, end: iso(last.getTime()) }
}

export function timelineColumns(
  start: string,
  end: string,
  scale: TimelineScale,
): TimelineColumn[] {
  const count = daysBetween(start, end)
  if (!count || count > 3660) return []
  if (scale === 'month') {
    return timelineDates(start, end).map((date, index) => {
      const day = new Date(stamp(date))
      const n = day.getUTCDate()
      return {
        date,
        end: date,
        label: index === 0 || n === 1 ? `${day.getUTCMonth() + 1}/${n}` : String(n),
        caption: ['日', '一', '二', '三', '四', '五', '六'][day.getUTCDay()]!,
        weekend: [0, 6].includes(day.getUTCDay()),
      }
    })
  }
  const columns: TimelineColumn[] = []
  let first = `${start.slice(0, 7)}-01`
  while (first <= end) {
    const range = calendarRange(first.slice(0, 7), 'month')!
    columns.push({
      date: range.start < start ? start : range.start,
      end: range.end > end ? end : range.end,
      label: `${Number(first.slice(5, 7))}月`,
      caption: `${first.slice(0, 4)}年`,
      weekend: false,
    })
    if (range.end >= end) break
    first = iso(stamp(range.end) + DAY)
  }
  return columns
}

// Each month has equal visual width; dates retain their exact position within that month.
export function timelineSpan(
  start: string,
  end: string,
  columns: TimelineColumn[],
  columnWidth: number,
) {
  if (!validRange(start, end) || !columns.length || columnWidth <= 0) return null
  const first = stamp(columns[0]!.date)
  const last = stamp(columns.at(-1)!.end) + DAY
  const from = Math.max(first, stamp(start))
  const to = Math.min(last, stamp(end) + DAY)
  if (from >= to) return null
  function offset(value: number) {
    if (value >= last) return columns.length * columnWidth
    const index = columns.findIndex((column) => value < stamp(column.end) + DAY)
    const column = columns[index]!
    const fraction = (value - stamp(column.date)) / (stamp(column.end) + DAY - stamp(column.date))
    return (index + fraction) * columnWidth
  }
  const left = offset(from)
  return { left, width: offset(to) - left }
}
