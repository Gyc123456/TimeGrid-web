<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import WorkspaceLayout from './layout/index.vue'
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <WorkspaceLayout />
  </ElConfigProvider>
</template>
