<script setup lang="ts">
import { ElButton } from 'element-plus'
import { Plus } from 'lucide-vue-next'
import { useTimeGridContext } from '../../composables/timeGridContext'
const { openModal } = useTimeGridContext()
</script>
<template>
  <div class="page-heading">
    <div>
      <div class="eyebrow">PLAN TOGETHER, MOVE FORWARD</div>
      <h1>项目排期<span class="heading-dot">.</span></h1>
      <p>看清每一段进度，让团队在同一节奏里前进。</p>
    </div>
    <ElButton
      type="primary"
      class="primary"
      @click="openModal('project')"
      ><Plus :size="17" />新建项目</ElButton
    >
  </div>
</template>
