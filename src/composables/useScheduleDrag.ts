import { ref, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import type { Member } from '../types/project'
import { iso, stamp } from '../utils/schedule'
import type { ConflictMode, checkChange } from '../utils/schedule'
interface DragOptions {
  dayWidth: Readonly<Ref<number>>
  conflictMode: Ref<ConflictMode>
  checkCandidate: (candidate: Member, notify?: boolean) => ReturnType<typeof checkChange>
  persistProjects: () => void
}
export function useScheduleDrag({
  dayWidth,
  conflictMode,
  checkCandidate,
  persistProjects,
}: DragOptions) {
  let drag: {
    member: Member
    x: number
    start: number
    end: number
    mode: 'move' | 'start' | 'end'
    conflictKey: string
  } | null = null
  const dragging = ref('')
  function begin(e: PointerEvent, m: Member, mode: 'move' | 'start' | 'end') {
    if (e.button !== 0) return
    e.preventDefault()
    drag = {
      member: m,
      x: e.clientX,
      start: stamp(m.start),
      end: stamp(m.end),
      mode,
      conflictKey: '',
    }
    dragging.value = m.id
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!drag) return
    const n = Math.round((e.clientX - drag.x) / dayWidth.value) * 86400000
    const { member, start, end, mode } = drag
    const candidate = {
      ...member,
      start: iso(mode === 'end' ? start : mode === 'start' ? Math.min(start + n, end) : start + n),
      end: iso(mode === 'start' ? end : mode === 'end' ? Math.max(end + n, start) : end + n),
    }
    if (conflictMode.value === 'warn') {
      const result = checkCandidate(candidate, false)
      const key = result.conflicts
        .map((m) => m.id)
        .sort()
        .join(',')
      if (key && key !== drag.conflictKey) checkCandidate(candidate)
      drag.conflictKey = key
    }
    member.start = candidate.start
    member.end = candidate.end
  }
  function finish() {
    if (!drag) return
    const { member, start, end } = drag
    if (
      conflictMode.value === 'block' &&
      (member.start !== iso(start) || member.end !== iso(end)) &&
      !checkCandidate(member).allowed
    ) {
      member.start = iso(start)
      member.end = iso(end)
    }
    drag = null
    dragging.value = ''
    persistProjects()
  }
  function cancelDrag() {
    if (drag) {
      drag.member.start = iso(drag.start)
      drag.member.end = iso(drag.end)
      drag = null
      dragging.value = ''
      persistProjects()
    }
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', finish)
  window.addEventListener('pointercancel', cancelDrag)
  window.addEventListener('blur', cancelDrag)
  onBeforeUnmount(() => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', finish)
    window.removeEventListener('pointercancel', cancelDrag)
    window.removeEventListener('blur', cancelDrag)
  })
  return { dragging, begin, finish, cancelDrag }
}
