import { useProjectEditor } from './useProjectEditor'
import { useScheduleDetails } from './useScheduleDetails'
import { computed, ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { Member, Project } from '../types/project'
import type { ConflictMode } from '../utils/schedule'
import { checkChange, conflictIds, daysBetween, iso, stamp, validRange } from '../utils/schedule'
import {
  calendarRange,
  fitTimelineColumnWidth,
  timelineColumns,
  timelineSpan,
} from '../utils/timeline'
import type { TimelineScale } from '../utils/timeline'
import { projectStyle } from '../config/projectAppearance'
import { createSeedProjects } from '../data/seedProjects'
import { useScheduleDrag } from './useScheduleDrag'
import { useScheduleMotion } from './useScheduleMotion'
import { useTimelineViewport } from './useTimelineViewport'
import { useAttachmentPreview } from './useAttachmentPreview'

export function useTimeGrid() {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const month = ref(todayStr.slice(0, 7))
  const timelineScale = ref<TimelineScale>('month')
  const rangeStart = ref(month.value + '-01')
  const rangeEnd = ref(iso(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0)))
  const seed = createSeedProjects(today)
  const storageKey = 'timegrid.projects.v1'
  const notice = ref('')
  function load(): Project[] {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return seed
      const parsed: unknown = JSON.parse(raw)
      if (
        !Array.isArray(parsed) ||
        !parsed.every(
          (p) =>
            typeof p.id === 'string' &&
            typeof p.name === 'string' &&
            (['purple', 'blue', 'green', 'orange'].includes(p.color) ||
              /^#[0-9a-f]{6}$/i.test(p.color)) &&
            Array.isArray(p.members) &&
            p.members.every(
              (m: Member) =>
                typeof m.id === 'string' &&
                typeof m.name === 'string' &&
                typeof m.role === 'string' &&
                /^\d{4}-\d{2}-\d{2}$/.test(m.start) &&
                /^\d{4}-\d{2}-\d{2}$/.test(m.end) &&
                Number.isFinite(stamp(m.start)) &&
                stamp(m.end) >= stamp(m.start),
            ),
        )
      )
        throw Error()
      return parsed
    } catch {
      notice.value = '本地数据无法读取，已显示示例数据。'
      return seed
    }
  }
  const projects = ref<Project[]>(
    load().map((p) => {
      const dates = p.members.flatMap((m) => [m.start, m.end]).sort()
      return {
        ...p,
        start: p.start || dates[0] || todayStr,
        end: p.end || dates.at(-1) || todayStr,
      }
    }),
  )
  function persistProjects() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(projects.value))
    } catch {
      notice.value = '浏览器存储不可用，请导出备份。'
    }
  }
  watch(
    projects,
    () => {
      if (!dragging.value) persistProjects()
    },
    { deep: true },
  )
  const query = ref('')
  const collapsed = ref(new Set<string>())
  const visible = computed(() =>
    projects.value
      .map((p) => ({
        ...p,
        members: p.name.includes(query.value)
          ? p.members
          : p.members.filter((m) => (m.name + m.role).includes(query.value)),
      }))
      .filter((p) => p.name.includes(query.value) || p.members.length),
  )
  const viewMode = ref<'projects' | 'people'>('projects')
  const personFilter = ref('')
  const selectedProject = ref('')
  const people = computed(() =>
    [...new Set(projects.value.flatMap((p) => p.members.map((m) => m.name.trim())))].sort(),
  )
  const assignments = computed(() => projects.value.flatMap((p) => p.members))
  // Provisional drag dates participate in conflict detection; rejection happens on release.
  const conflicts = computed(() => conflictIds(assignments.value))
  function readConflictMode(): ConflictMode {
    try {
      return localStorage.getItem('timegrid.conflict-mode') === 'block' ? 'block' : 'warn'
    } catch {
      return 'warn'
    }
  }
  const conflictMode = ref<ConflictMode>(readConflictMode())
  watch(conflictMode, (mode) => {
    cancelDrag()
    try {
      localStorage.setItem('timegrid.conflict-mode', mode)
    } catch {
      notice.value = '重叠规则无法保存到浏览器。'
    }
    if (mode === 'block' && conflicts.value.size)
      ElMessage.warning('已启用禁止重叠；已有冲突仍会标记，请调整排期消除冲突。')
  })
  const displayed = computed(() => {
    const filtered = visible.value
      .filter((p) => !selectedProject.value || p.id === selectedProject.value)
      .map((p) => ({
        ...p,
        members: p.members.filter(
          (m) => !personFilter.value || m.name.trim() === personFilter.value,
        ),
      }))
    if (viewMode.value === 'projects') return filtered
    const grouped = new Map<string, Project>()
    for (const p of filtered)
      for (const m of p.members) {
        const name = m.name.trim()
        if (!grouped.has(name))
          grouped.set(name, {
            id: 'person:' + name,
            name,
            color: 'purple',
            members: [],
            start: m.start,
            end: m.end,
          })
        const group = grouped.get(name)!
        group.members.push(m)
        group.start = group.start! < m.start ? group.start : m.start
        group.end = group.end! > m.end ? group.end : m.end
      }
    return [...grouped.values()]
  })
  function owner(m: Member) {
    return projects.value.find((p) => p.members.some((row) => row.id === m.id))!
  }
  function fitProjectRange() {
    if (timelineScale.value === 'year') return
    const list = selectedProject.value
      ? projects.value.filter((p) => p.id === selectedProject.value)
      : projects.value
    if (!list.length) return
    const start = list.map((p) => p.start!).sort()[0]!,
      end = list
        .map((p) => p.end!)
        .sort()
        .at(-1)!
    setRange(start, end)
  }
  watch(viewMode, (mode) => {
    if (mode === 'projects') fitProjectRange()
  })
  onMounted(fitProjectRange)
  function showAllProjects() {
    cancelDrag()
    query.value = ''
    personFilter.value = ''
    selectedProject.value = ''
    viewMode.value = 'projects'
    collapsed.value = new Set()
    fitProjectRange()
  }
  function selectProject(id: string) {
    cancelDrag()
    selectedProject.value = id
    query.value = ''
    personFilter.value = ''
    viewMode.value = 'projects'
    collapsed.value = new Set()
    fitProjectRange()
  }
  function checkCandidate(candidate: Member, notify = true) {
    const result = checkChange(candidate, assignments.value, conflictMode.value)
    if (result.conflicts.length && notify) {
      const names = [...new Set(result.conflicts.map((m) => owner(m as Member).name))].join('、')
      ElMessage({
        type: 'warning',
        message: result.allowed
          ? `${candidate.name} 与「${names}」排期重叠，已标记黄色警告。`
          : `${candidate.name} 与「${names}」排期重叠，已禁止并还原本次修改。`,
        duration: 3200,
        grouping: true,
      })
    }
    return result
  }
  const timelineStart = computed(() => stamp(rangeStart.value))
  const columns = computed(() =>
    timelineColumns(rangeStart.value, rangeEnd.value, timelineScale.value).map((column) => ({
      ...column,
      current: column.date <= todayStr && column.end >= todayStr,
    })),
  )
  function setRange(start: string, end: string) {
    if (!validRange(start, end)) {
      ElMessage.warning('查看结束日期不能早于开始日期。')
      return
    }
    if (daysBetween(start, end) > 3660) {
      ElMessage.warning('单次查看范围最多为 3660 天，请缩小日期范围。')
      return
    }
    cancelDrag()
    rangeStart.value = start
    rangeEnd.value = end
    month.value = start.slice(0, 7)
  }
  function setMonth(value: string) {
    const range = calendarRange(value, 'month')
    if (range) setRange(range.start, range.end)
  }
  function setYear(value: string) {
    const range = calendarRange(value, 'year')
    if (!range) return
    const focusedMonth = month.value.slice(5, 7)
    setRange(range.start, range.end)
    month.value = `${value}-${focusedMonth}`
  }
  function setTimelineScale(value: unknown) {
    if (value !== 'month' && value !== 'year') return
    if (value === timelineScale.value) return
    cancelDrag()
    timelineScale.value = value
    if (value === 'year') setYear(month.value.slice(0, 4))
    else setMonth(month.value)
  }
  function goToToday() {
    month.value = todayStr.slice(0, 7)
    if (timelineScale.value === 'year') setYear(todayStr.slice(0, 4))
    else setMonth(todayStr.slice(0, 7))
  }

  const dayWidth = ref(44)
  const { timelineViewport, timelineHeading, availableTimelineWidth } = useTimelineViewport()
  const columnWidth = computed(() =>
    fitTimelineColumnWidth(
      availableTimelineWidth.value,
      columns.value.length,
      timelineScale.value === 'year' ? 60 : dayWidth.value,
    ),
  )
  const timelineWidth = computed(() => columns.value.length * columnWidth.value)
  const rangeDayCount = computed(() => daysBetween(rangeStart.value, rangeEnd.value))
  const totalPeople = computed(
    () => new Set(projects.value.flatMap((p) => p.members.map((m) => m.name))).size,
  )
  const activeCount = computed(
    () => projects.value.filter((p) => p.start! <= todayStr && p.end! >= todayStr).length,
  )
  const totalDays = computed(() =>
    projects.value.flatMap((p) => p.members).reduce((n, m) => n + duration(m), 0),
  )
  function duration(m: Member) {
    return daysBetween(m.start, m.end)
  }
  function shiftPeriod(delta: number) {
    if (timelineScale.value === 'year') {
      setYear(String(Number(month.value.slice(0, 4)) + delta).padStart(4, '0'))
      return
    }
    const d = new Date(timelineStart.value)
    d.setUTCMonth(d.getUTCMonth() + delta, 1)
    setMonth(iso(d.getTime()).slice(0, 7))
  }
  function toggle(id: string) {
    const s = new Set(collapsed.value)
    if (s.has(id)) {
      s.delete(id)
    } else {
      s.add(id)
    }
    collapsed.value = s
  }
  function bounds(p: Project) {
    return `${p.start} — ${p.end}`
  }
  function periodStyle(start: string, end: string) {
    const span = timelineSpan(start, end, columns.value, columnWidth.value)
    if (!span) return { display: 'none' }
    const inset = Math.min(timelineScale.value === 'year' ? 1 : 4, span.width / 4)
    return {
      left: `${span.left + inset}px`,
      width: `${Math.max(1, span.width - inset * 2)}px`,
    }
  }
  function barStyle(m: Member) {
    return {
      ...projectStyle(owner(m)),
      ...periodStyle(m.start, m.end),
    }
  }
  function projectBarStyle(p: Project) {
    return { ...projectStyle(p), ...periodStyle(p.start!, p.end!) }
  }
  function inView(period: { start?: string; end?: string }) {
    return (
      !!period.start &&
      !!period.end &&
      period.end >= rangeStart.value &&
      period.start <= rangeEnd.value
    )
  }
  const {
    dragging,
    begin: beginDrag,
    finish,
    cancelDrag,
  } = useScheduleDrag({
    dayWidth: columnWidth,
    conflictMode,
    checkCandidate,
    persistProjects,
  })
  function begin(event: PointerEvent, member: Member, mode: 'move' | 'start' | 'end') {
    if (timelineScale.value === 'month') beginDrag(event, member, mode)
  }
  function editDate(m: Member, key: 'start' | 'end', value: string | null) {
    if (!value || !validRange(key === 'start' ? value : m.start, key === 'end' ? value : m.end)) {
      notice.value = '结束日期不能早于开始日期。'
      return
    }
    if (!checkCandidate({ ...m, [key]: value }).allowed) return
    m[key] = value
    notice.value = ''
  }
  function beforeStart(date: Date, start: string) {
    return date.getTime() < new Date(start + 'T00:00:00').getTime()
  }
  function afterEnd(date: Date, end: string) {
    return date.getTime() > new Date(end + 'T00:00:00').getTime()
  }

  const {
    modal,
    selected,
    editingProject,
    iconLoading,
    form,
    error,
    openModal,
    projectMenu,
    openProjectMenu,
    editProject,
    deleteProject,
    uploadProjectIcon,
    save,
    chooseProjectIcon,
  } = useProjectEditor({
    projects,
    todayStr,
    storageKey,
    viewMode,
    selectedProject,
    collapsed,
    fitProjectRange,
    cancelDrag,
    checkCandidate,
  })
  const {
    detail,
    detailError,
    detailStatus,
    readingFiles,
    openDetails,
    syncDates,
    syncDuration,
    uploadAttachment,
    saveDetails,
  } = useScheduleDetails({ projects, assignments, todayStr, storageKey, finish, checkCandidate })
  const { attachmentPreview, closePreview, previewAttachment, downloadAttachment } =
    useAttachmentPreview()
  const { ganttElement, scheduleCard } = useScheduleMotion({
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
  })
  function exportData() {
    const blob = new Blob([JSON.stringify(projects.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `TimeGrid-${todayStr}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const sidebar = ref(true)

  return {
    activeCount,
    afterEnd,
    attachmentPreview,
    barStyle,
    beforeStart,
    begin,
    bounds,
    chooseProjectIcon,
    closePreview,
    collapsed,
    conflictMode,
    conflicts,
    columns,
    columnWidth,
    dayWidth,
    deleteProject,
    detail,
    detailError,
    detailStatus,
    displayed,
    downloadAttachment,
    dragging,
    duration,
    editDate,
    editProject,
    editingProject,
    error,
    exportData,
    form,
    ganttElement,
    goToToday,
    iconLoading,
    inView,
    modal,
    month,
    notice,
    openDetails,
    openModal,
    openProjectMenu,
    owner,
    people,
    personFilter,
    previewAttachment,
    projectMenu,
    projectBarStyle,
    projects,
    query,
    rangeEnd,
    rangeDayCount,
    rangeStart,
    readingFiles,
    save,
    saveDetails,
    scheduleCard,
    selectProject,
    selected,
    selectedProject,
    setMonth,
    setYear,
    setTimelineScale,
    setRange,
    shiftPeriod,
    showAllProjects,
    sidebar,
    syncDates,
    syncDuration,
    timelineWidth,
    timelineViewport,
    timelineHeading,
    timelineScale,
    today,
    todayStr,
    toggle,
    totalDays,
    totalPeople,
    uploadAttachment,
    uploadProjectIcon,
    viewMode,
  }
}
