<script setup lang="ts">
import { provide } from 'vue'
import { useTimeGrid } from '../composables/useTimeGrid'
import { timeGridKey } from '../composables/timeGridContext'
import ScheduleDetailsDialog from '../components/schedule/ScheduleDetailsDialog.vue'
import GanttBoard from '../components/schedule/GanttBoard.vue'
import ProjectStats from '../components/layout/ProjectStats.vue'
import WorkspaceFooter from '../components/layout/WorkspaceFooter.vue'
import WorkspaceHeader from '../components/layout/WorkspaceHeader.vue'
import WorkspaceHeading from '../components/layout/WorkspaceHeading.vue'
import WorkspaceSidebar from '../components/layout/WorkspaceSidebar.vue'
import ProjectEditorDialog from '../components/projects/ProjectEditorDialog.vue'
import ProjectContextMenu from '../components/projects/ProjectContextMenu.vue'
import AttachmentPreviewDialog from '../components/attachments/AttachmentPreviewDialog.vue'
defineOptions({ name: 'WorkspaceLayout' })
const grid = useTimeGrid()
provide(timeGridKey, grid)
const { sidebar } = grid
</script>
<template>
  <div
    class="app-shell"
    :class="{ compact: !sidebar }"
  >
    <WorkspaceSidebar v-if="sidebar" />
    <main>
      <WorkspaceHeader />
      <section class="content">
        <WorkspaceHeading />
        <ProjectStats />
        <GanttBoard />
        <WorkspaceFooter />
      </section>
    </main>
    <ProjectContextMenu />
    <ProjectEditorDialog />
    <ScheduleDetailsDialog />
    <AttachmentPreviewDialog />
  </div>
</template>
