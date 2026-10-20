import { usePageMotion } from './usePageMotion'
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import gsap from 'gsap'
import type { Member } from '../types/project'
import type { ConflictMode } from '../utils/schedule'
import type { TimelineScale } from '../utils/timeline'
interface MotionOptions {
  conflictMode: Ref<ConflictMode>
  conflicts: Ref<Set<string>>
  selectedProject: Ref<string>
  viewMode: Ref<'projects' | 'people'>
  timelineScale: Ref<TimelineScale>
  query: Ref<string>
  personFilter: Ref<string>
  rangeStart: Ref<string>
  rangeEnd: Ref<string>
  collapsed: Ref<Set<string>>
  assignments: Ref<Member[]>
}
export function useScheduleMotion({
  conflictMode,
  conflicts,
  selectedProject,
  viewMode,
  timelineScale,
  query,
  personFilter,
  rangeStart,
  rangeEnd,
  collapsed,
  assignments,
}: MotionOptions) {
  const ganttElement = ref<HTMLElement>()
  const scheduleCard = ref<HTMLElement>()
  let glow: gsap.core.Tween | undefined
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  function animateConflicts() {
    glow?.kill()
    const root = ganttElement.value
    if (!root) return
    const bars = root.querySelectorAll('.task-bar')
    gsap.set(bars, { clearProps: 'boxShadow' })
    const highlighted = root.querySelectorAll('.task-bar.has-conflict')
    if (!highlighted.length) return
    const color = conflictMode.value === 'block' ? '239,68,68' : '226,170,44'
    if (reducedMotion.matches) {
      gsap.set(highlighted, { boxShadow: `0 0 0 2px rgba(${color},.4)` })
      return
    }
    glow = gsap.fromTo(
      highlighted,
      { boxShadow: `0 0 0 1px rgba(${color},.2)` },
      {
        boxShadow: `0 0 10px 2px rgba(${color},.45)`,
        duration: 1.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      },
    )
  }
  const pageKey = computed(
    () => `${selectedProject.value}:${viewMode.value}:${timelineScale.value}`,
  )
  const resultKey = computed(() =>
    JSON.stringify([
      query.value,
      personFilter.value,
      rangeStart.value,
      rangeEnd.value,
      [...collapsed.value],
      assignments.value.map((member) => member.id),
    ]),
  )
  usePageMotion(scheduleCard, resultKey, {
    axis: 'x',
    pageKey,
    layerSelector:
      '.card-toolbar, .view-controls, .calendar-toolbar, .range-toolbar, .gantt-scroll, .table-footer',
    resultSelector: '.task-bar',
  })
  watch([pageKey, resultKey], () => nextTick(animateConflicts), { flush: 'post' })
  watch(
    () => conflictMode.value + ':' + [...conflicts.value].sort().join('|'),
    () => nextTick(animateConflicts),
    { flush: 'post' },
  )
  onMounted(() => {
    animateConflicts()
    reducedMotion.addEventListener('change', animateConflicts)
  })
  onBeforeUnmount(() => {
    glow?.kill()
    reducedMotion.removeEventListener('change', animateConflicts)
  })

  return { ganttElement, scheduleCard }
}
