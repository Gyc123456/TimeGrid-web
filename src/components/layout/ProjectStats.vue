<script setup lang="ts">
import { useTimeGridContext } from '../../composables/timeGridContext'
const { activeCount, projects, totalDays, totalPeople } = useTimeGridContext()
import { CalendarDays, Grid2X2, Layers, Users } from 'lucide-vue-next'
</script>
<template>
  <div class="stats">
    <div>
      <span class="stat-icon purple"><Layers :size="20" /></span>
      <div>
        <span>项目总数</span
        ><strong>{{ projects.length.toString().padStart(2, '0') }}<small>个项目</small></strong>
      </div>
    </div>
    <div>
      <span class="stat-icon blue"><Users :size="20" /></span>
      <div>
        <span>参与成员</span
        ><strong>{{ totalPeople.toString().padStart(2, '0') }}<small>位伙伴</small></strong>
      </div>
    </div>
    <div>
      <span class="stat-icon green"><CalendarDays :size="20" /></span>
      <div>
        <span>进行中的项目</span
        ><strong
          >{{ activeCount.toString().padStart(2, '0')
          }}<small><i class="live-dot"></i>正在推进</small></strong
        >
      </div>
    </div>
    <div>
      <span class="stat-icon orange"><Grid2X2 :size="20" /></span>
      <div>
        <span>计划投入</span><strong>{{ totalDays }}<small>人天</small></strong>
      </div>
    </div>
  </div>
</template>
