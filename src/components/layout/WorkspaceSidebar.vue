<script setup lang="ts">
import { useTimeGridContext } from '../../composables/timeGridContext'
const { openModal, openProjectMenu, projects, selectProject, selectedProject, showAllProjects } =
  useTimeGridContext()
import { ElButton } from 'element-plus'
import { ArrowUpRight, CalendarDays, Grid2X2, Layers, Plus } from 'lucide-vue-next'
import { projectIcon, projectStyle } from '../../config/projectAppearance'
</script>
<template>
  <aside class="sidebar">
    <a
      class="brand"
      href="#"
      ><span class="brand-icon"><Grid2X2 :size="22" /></span>TimeGrid<span class="brand-dot"
        >®</span
      ></a
    >
    <div class="nav-label">工作空间</div>
    <ElButton
      text
      class="nav-item active"
      @click="showAllProjects"
      ><CalendarDays :size="18" />项目排期<span class="nav-count">{{
        projects.length
      }}</span></ElButton
    >
    <div class="sidebar-projects">
      <div class="nav-label">
        我的项目 <span>{{ projects.length }}</span>
      </div>
      <ElButton
        v-for="p in projects"
        :key="p.id"
        text
        :class="{ 'selected-project': selectedProject === p.id }"
        @click="selectProject(p.id)"
        @contextmenu.prevent="openProjectMenu($event, p)"
        ><span
          class="project-icon"
          :style="projectStyle(p)"
          ><img
            v-if="p.icon"
            :src="p.icon"
            alt="" /><component
            :is="projectIcon(p)"
            v-else
            :size="15" /></span
        >{{ p.name }}</ElButton
      ><ElButton
        text
        class="add-project"
        @click="openModal('project')"
        ><Plus :size="16" />创建新项目</ElButton
      >
    </div>
    <div class="sidebar-note">
      <div class="note-grid"><Layers :size="21" /></div>
      <strong>每个计划，都看得见。</strong>
      <p>把复杂的项目，变成清晰的时间线。</p>
      <span>MAKE TIME FOR GREAT WORK <ArrowUpRight :size="13" /></span>
    </div>
    <div class="profile">
      <div class="avatar dark">我</div>
      <div>我的工作空间<small>本地个人版</small></div>
      <span class="online"></span>
    </div>
  </aside>
</template>
