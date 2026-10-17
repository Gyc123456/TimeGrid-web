<script setup lang="ts">
import { useTimeGridContext } from '../../composables/timeGridContext'
const { deleteProject, editProject, projectMenu } = useTimeGridContext()
import { ElButton } from 'element-plus'
</script>
<template>
  <Teleport to="body"
    ><div
      v-if="projectMenu"
      class="project-context-menu"
      role="menu"
      aria-label="项目操作"
      :style="{ left: projectMenu.x + 'px', top: projectMenu.y + 'px' }"
      @pointerdown.stop
      @contextmenu.prevent
    >
      <ElButton
        text
        role="menuitem"
        @click="editProject(projectMenu.id)"
        >修改项目</ElButton
      ><ElButton
        text
        type="danger"
        role="menuitem"
        @click="deleteProject(projectMenu.id)"
        >删除项目</ElButton
      >
    </div></Teleport
  >
</template>
