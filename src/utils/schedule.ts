export const DAY = 86_400_000
export const stamp = (date: string) => Date.parse(`${date}T00:00:00Z`)
export const iso = (value: number) => new Date(value).toISOString().slice(0, 10)
export function validDate(date: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(stamp(date)) && iso(stamp(date)) === date
  )
}
export function validRange(start: string, end: string): boolean {
  return validDate(start) && validDate(end) && start <= end
}
export function daysBetween(start: string, end: string): number {
  return validRange(start, end) ? Math.round((stamp(end) - stamp(start)) / DAY) + 1 : 0
}
export function endFromDuration(start: string, days: number): string | null {
  if (!validDate(start) || !Number.isInteger(days) || days < 1 || days > 36500) return null
  const end = iso(stamp(start) + (days - 1) * DAY)
  return validDate(end) ? end : null
}

export interface Assignment {
  id: string
  name: string
  start: string
  end: string
}
export type ConflictMode = 'warn' | 'block'
export function overlaps(a: Assignment, b: Assignment): boolean {
  return (
    a.id !== b.id &&
    a.name.trim() === b.name.trim() &&
    validRange(a.start, a.end) &&
    validRange(b.start, b.end) &&
    a.start <= b.end &&
    b.start <= a.end
  )
}
export function conflictsFor(candidate: Assignment, assignments: Assignment[]): Assignment[] {
  return assignments.filter((other) => overlaps(candidate, other))
}
export function conflictIds(assignments: Assignment[]): Set<string> {
  const ids = new Set<string>()
  for (let i = 0; i < assignments.length; i++)
    for (let j = i + 1; j < assignments.length; j++) {
      if (overlaps(assignments[i]!, assignments[j]!)) {
        ids.add(assignments[i]!.id)
        ids.add(assignments[j]!.id)
      }
    }
  return ids
}
export function checkChange(candidate: Assignment, assignments: Assignment[], mode: ConflictMode) {
  const conflicts = conflictsFor(candidate, assignments)
  return { conflicts, allowed: mode === 'warn' || conflicts.length === 0 }
}

export function timelineDates(start: string, end: string): string[] {
  const count = daysBetween(start, end)
  if (!count || count > 3660) return []
  return Array.from({ length: count }, (_, i) => iso(stamp(start) + i * DAY))
}

export function completionStatus(progress: number, end: string, today: string) {
  if (progress >= 100) return '已完成'
  if (validDate(end) && end < today) return '滞后'
  return progress > 0 ? '进行中' : '未开始'
}
