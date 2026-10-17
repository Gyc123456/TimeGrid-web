<script setup lang="ts">
import { ElButton } from 'element-plus'
import { PanelLeftClose } from 'lucide-vue-next'
import { useTimeGridContext } from '../../composables/timeGridContext'
const { sidebar } = useTimeGridContext()
</script>
<template>
  <header class="topbar">
    <div>
      <ElButton
        text
        class="icon-btn"
        aria-label="切换侧栏"
        @click="sidebar = !sidebar"
        ><PanelLeftClose :size="18" /></ElButton
      ><span class="breadcrumb">工作空间</span><span class="slash">/</span><span>项目排期</span>
    </div>
    <span class="save-state"><span></span>本地自动保存</span>
  </header>
</template>
