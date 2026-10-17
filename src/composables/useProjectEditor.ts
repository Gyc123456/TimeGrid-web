import { ref, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile } from 'element-plus'
import type { Member, Project } from '../types/project'
import { validRange, daysBetween } from '../utils/schedule'
import type { checkChange } from '../utils/schedule'
import { projectColor } from '../config/projectAppearance'
interface ProjectEditorOptions {
  projects: Ref<Project[]>
  todayStr: string
  storageKey: string
  viewMode: Ref<'projects' | 'people'>
  selectedProject: Ref<string>
  collapsed: Ref<Set<string>>
  fitProjectRange: () => void
  cancelDrag: () => void
  checkCandidate: (candidate: Member, notify?: boolean) => ReturnType<typeof checkChange>
}
export function useProjectEditor({
  projects,
  todayStr,
  storageKey,
  viewMode,
  selectedProject,
  collapsed,
  fitProjectRange,
  cancelDrag,
  checkCandidate,
}: ProjectEditorOptions) {
  function chooseProjectIcon(key: string) {
    form.value.iconKey = key
    form.value.icon = ''
  }
  const modal = ref<'project' | 'member' | null>(null)
  const selected = ref('')
  const editingProject = ref('')
  const iconLoading = ref(false)
  const form = ref({
    name: '',
    role: '',
    start: todayStr,
    end: todayStr,
    color: '#8c76d6',
    icon: '',
    iconKey: 'layers',
  })
  const error = ref('')
  function openModal(type: 'project' | 'member', id = '') {
    editingProject.value = ''
    modal.value = type
    selected.value = id
    const project = projects.value.find((p) => p.id === id)
    form.value = {
      name: '',
      role: '',
      start: project?.start || todayStr,
      end: project?.end || todayStr,
      color: '#8c76d6',
      icon: '',
      iconKey: 'layers',
    }
    error.value = ''
  }
  const projectMenu = ref<{ id: string; x: number; y: number } | null>(null)
  function openProjectMenu(event: MouseEvent, p: Project) {
    if (viewMode.value === 'people' && p.id.startsWith('person:')) return
    projectMenu.value = {
      id: p.id,
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - 170)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - 110)),
    }
  }
  function closeProjectMenu() {
    projectMenu.value = null
  }
  function menuKey(event: KeyboardEvent) {
    if (event.key === 'Escape') closeProjectMenu()
  }
  window.addEventListener('pointerdown', closeProjectMenu)
  window.addEventListener('keydown', menuKey)
  window.addEventListener('resize', closeProjectMenu)
  window.addEventListener('scroll', closeProjectMenu, true)
  onBeforeUnmount(() => {
    window.removeEventListener('pointerdown', closeProjectMenu)
    window.removeEventListener('keydown', menuKey)
    window.removeEventListener('resize', closeProjectMenu)
    window.removeEventListener('scroll', closeProjectMenu, true)
  })
  function editProject(id: string) {
    const project = projects.value.find((p) => p.id === id)
    if (!project) return
    closeProjectMenu()
    openModal('project')
    editingProject.value = id
    form.value = {
      name: project.name,
      role: '',
      start: project.start!,
      end: project.end!,
      color: projectColor(project),
      icon: project.icon || '',
      iconKey: project.iconKey || 'layers',
    }
  }
  async function deleteProject(id: string) {
    const project = projects.value.find((p) => p.id === id)
    if (!project) return
    closeProjectMenu()
    try {
      await ElMessageBox.confirm(
        `删除「${project.name}」及其 ${project.members.length} 条人员排期、附件？`,
        '删除项目',
        { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
      )
    } catch {
      return
    }
    cancelDrag()
    const updated = projects.value.filter((p) => p.id !== id)
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch {
      ElMessage.error('本地存储不可用，未删除项目。')
      return
    }
    projects.value = updated
    if (selectedProject.value === id) selectedProject.value = ''
    if (viewMode.value === 'projects') fitProjectRange()
    ElMessage.success('项目已删除')
  }
  async function uploadProjectIcon(file: UploadFile) {
    const raw = file.raw,
      draft = form.value
    if (!raw) return
    if (
      !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(raw.type) ||
      raw.size > 512 * 1024
    ) {
      error.value = '请选择不超过 512 KB 的 PNG、JPG、WebP 或 GIF 图片。'
      return
    }
    iconLoading.value = true
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(raw)
      })
      const image = new Image()
      image.src = data
      await image.decode()
      if (form.value === draft) {
        draft.icon = data
        error.value = ''
      }
    } catch {
      error.value = '图片无法读取，请重新选择。'
    } finally {
      iconLoading.value = false
    }
  }
  function save() {
    if (iconLoading.value) return
    if (!form.value.name.trim()) {
      error.value = '请输入名称'
      return
    }
    if (!validRange(form.value.start, form.value.end)) {
      error.value = '请选择有效的起止日期'
      return
    }
    if (modal.value === 'project') {
      if (daysBetween(form.value.start, form.value.end) > 3660) {
        error.value = '项目时间范围最多为 3660 天。'
        return
      }
      const data = {
        name: form.value.name.trim(),
        color: form.value.color || '#8c76d6',
        icon: form.value.icon,
        iconKey: form.value.iconKey,
        start: form.value.start,
        end: form.value.end,
      }
      const updated = editingProject.value
        ? projects.value.map((p) => (p.id === editingProject.value ? { ...p, ...data } : p))
        : [...projects.value, { id: crypto.randomUUID(), ...data, members: [] }]
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated))
      } catch {
        error.value = '本地存储空间不足，未保存，请缩小图标后重试。'
        return
      }
      projects.value = updated
      if (viewMode.value === 'projects') fitProjectRange()
    } else {
      const candidate = {
        id: crypto.randomUUID(),
        name: form.value.name.trim(),
        role: form.value.role.trim() || '项目成员',
        start: form.value.start,
        end: form.value.end,
      }
      if (!checkCandidate(candidate).allowed) {
        error.value = '该人员的排期重叠，请调整起止日期。'
        return
      }
      projects.value.find((p) => p.id === selected.value)?.members.push(candidate)
      collapsed.value.delete(selected.value)
    }
    modal.value = null
  }

  return {
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
  }
}
