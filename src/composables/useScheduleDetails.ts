import { ref, computed, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import type { UploadFile } from 'element-plus'
import type { Attachment, Member, Project } from '../types/project'
import { completionStatus, daysBetween, endFromDuration, validRange } from '../utils/schedule'
import type { checkChange } from '../utils/schedule'
interface ScheduleDetailsOptions {
  projects: Ref<Project[]>
  assignments: Ref<Member[]>
  todayStr: string
  storageKey: string
  finish: () => void
  checkCandidate: (candidate: Member, notify?: boolean) => ReturnType<typeof checkChange>
}
export function useScheduleDetails({
  projects,
  assignments,
  todayStr,
  storageKey,
  finish,
  checkCandidate,
}: ScheduleDetailsOptions) {
  const detail = ref<{
    projectId: string
    memberId: string
    name: string
    start: string
    end: string
    days: number | undefined
    progress: number
    notes: string
    attachments: Attachment[]
  } | null>(null)
  const statusToday = ref(todayStr)
  function refreshStatusDate() {
    const now = new Date()
    statusToday.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
  const statusClock = window.setInterval(refreshStatusDate, 60000)
  onBeforeUnmount(() => window.clearInterval(statusClock))
  const detailStatus = computed(() =>
    detail.value
      ? completionStatus(detail.value.progress, detail.value.end, statusToday.value)
      : '未开始',
  )
  const detailError = ref('')
  const readingFiles = ref(false)
  function openDetails(projectId: string, member: Member) {
    refreshStatusDate()
    finish()
    detail.value = {
      projectId,
      memberId: member.id,
      name: member.name,
      start: member.start,
      end: member.end,
      days: daysBetween(member.start, member.end),
      progress: Number.isFinite(member.progress)
        ? Math.min(100, Math.max(0, Math.round(member.progress!)))
        : 0,
      notes: member.notes || '',
      attachments: (member.attachments || []).map((a) => ({ ...a })),
    }
    detailError.value = ''
  }
  function syncDates() {
    if (!detail.value) return
    detail.value.days = daysBetween(detail.value.start, detail.value.end) || undefined
    detailError.value = detail.value.days ? '' : '结束日期不能早于开始日期。'
  }
  function syncDuration(value: number | null | undefined) {
    if (!detail.value) return
    detail.value.days = value ?? undefined
    const end = endFromDuration(detail.value.start, Number(detail.value.days))
    if (!end) {
      detailError.value = '工作时长请输入 1–36500 的整数天数。'
      return
    }
    detail.value.end = end
    detailError.value = ''
  }
  let pendingBytes = 0
  let pendingReads = 0
  async function uploadAttachment(uploadFile: UploadFile) {
    const file = uploadFile.raw
    const draft = detail.value
    if (!draft || !file) return
    const size = draft.attachments.reduce((n, a) => n + a.size, 0) + pendingBytes + file.size
    if (file.size > 1024 * 1024 || size > 2 * 1024 * 1024) {
      detailError.value = '单个附件不超过 1 MB，每位成员附件合计不超过 2 MB。'
      return
    }
    pendingBytes += file.size
    pendingReads++
    readingFiles.value = true
    try {
      const added = await new Promise<Attachment>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () =>
          resolve({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            data: String(reader.result),
          })
        reader.onerror = () => reject(new Error('附件读取失败'))
        reader.readAsDataURL(file)
      })
      if (detail.value === draft) draft.attachments.push(added)
    } catch {
      detailError.value = '附件读取失败，请重新选择。'
    } finally {
      pendingBytes -= file.size
      pendingReads--
      readingFiles.value = pendingReads > 0
    }
  }

  function saveDetails() {
    const d = detail.value
    if (!d || readingFiles.value) return
    if (!Number.isInteger(d.progress) || d.progress < 0 || d.progress > 100) {
      detailError.value = '开发进度请输入 0–100 的整数。'
      return
    }
    if (
      !validRange(d.start, d.end) ||
      daysBetween(d.start, d.end) !== Number(d.days) ||
      !endFromDuration(d.start, Number(d.days))
    ) {
      detailError.value = '请检查起止日期与工作时长，时长须为正整数天数。'
      return
    }
    const original = assignments.value.find((m) => m.id === d.memberId)
    if (!original) return
    if (
      (d.start !== original.start || d.end !== original.end) &&
      !checkCandidate({ ...original, start: d.start, end: d.end }).allowed
    ) {
      detailError.value = '排期重叠，未保存；甘特图已保留原排期，请调整日期。'
      return
    }
    const updated = projects.value.map((p) =>
      p.id !== d.projectId
        ? p
        : {
            ...p,
            members: p.members.map((m) =>
              m.id !== d.memberId
                ? m
                : {
                    ...m,
                    start: d.start,
                    end: d.end,
                    progress: d.progress,
                    notes: d.notes,
                    attachments: d.attachments.map((a) => ({ ...a })),
                  },
            ),
          },
    )
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch {
      detailError.value = '本地存储空间不足或不可用，请减少附件后重试。内容尚未保存。'
      return
    }
    projects.value = updated
    detail.value = null
  }

  return {
    detail,
    detailError,
    detailStatus,
    readingFiles,
    openDetails,
    syncDates,
    syncDuration,
    uploadAttachment,
    saveDetails,
  }
}
