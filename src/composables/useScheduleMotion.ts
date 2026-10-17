import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import gsap from 'gsap'
import type { Member } from '../types/project'
import type { ConflictMode } from '../utils/schedule'
interface MotionOptions {
  conflictMode: Ref<ConflictMode>
  conflicts: Ref<Set<string>>
  selectedProject: Ref<string>
  viewMode: Ref<'projects' | 'people'>
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
  query,
  personFilter,
  rangeStart,
  rangeEnd,
  collapsed,
  assignments,
}: MotionOptions) {
  const ganttElement = ref<HTMLElement>()
  const scheduleCard = ref<HTMLElement>()
  let pageTransition: gsap.core.Tween | undefined
  let entrance: gsap.core.Tween | undefined
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
  function animateProjectSwitch() {
    pageTransition?.kill()
    const panel = scheduleCard.value
    if (!panel) return
    gsap.set(panel, { clearProps: 'opacity,transform' })
    if (reducedMotion.matches) return
    pageTransition = gsap.fromTo(
      panel,
      { opacity: 0.35, x: 20 },
      { opacity: 1, x: 0, duration: 0.36, ease: 'power2.out', clearProps: 'opacity,transform' },
    )
  }
  watch(() => [selectedProject.value, viewMode.value], animateProjectSwitch, { flush: 'post' })
  async function animateView() {
    await nextTick()
    entrance?.kill()
    if (ganttElement.value) {
      const rows = ganttElement.value.querySelectorAll('.task-bar')
      gsap.set(rows, { clearProps: 'opacity,transform' })
      if (!reducedMotion.matches)
        entrance = gsap.fromTo(
          rows,
          { opacity: 0, y: 5 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: { each: 0.025, amount: 0.3 },
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          },
        )
    }
    animateConflicts()
  }
  watch(
    () => [
      viewMode.value,
      query.value,
      personFilter.value,
      selectedProject.value,
      rangeStart.value,
      rangeEnd.value,
      [...collapsed.value].join('|'),
      assignments.value.map((m) => m.id).join('|'),
    ],
    animateView,
    { flush: 'post' },
  )
  watch(
    () => conflictMode.value + ':' + [...conflicts.value].sort().join('|'),
    () => nextTick(animateConflicts),
    { flush: 'post' },
  )
  onMounted(() => {
    animateView()
    reducedMotion.addEventListener('change', animateView)
  })
  onBeforeUnmount(() => {
    pageTransition?.kill()
    entrance?.kill()
    glow?.kill()
    reducedMotion.removeEventListener('change', animateView)
  })

  return { ganttElement, scheduleCard }
}
