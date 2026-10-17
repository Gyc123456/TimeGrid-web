<script setup lang="ts">
import { useTimeGridContext } from '../../composables/timeGridContext'
const {
  afterEnd,
  beforeStart,
  conflictMode,
  conflicts,
  dayWidth,
  days,
  exportData,
  month,
  people,
  personFilter,
  projects,
  query,
  rangeEnd,
  rangeStart,
  setMonth,
  setRange,
  shiftMonth,
  showAllProjects,
  todayStr,
  viewMode,
} = useTimeGridContext()
import {
  ElButton,
  ElDatePicker,
  ElInput,
  ElOption,
  ElRadioButton,
  ElRadioGroup,
  ElSelect,
  ElTag,
} from 'element-plus'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  MousePointer2,
  Search,
} from 'lucide-vue-next'
</script>
<template>
  <div class="card-toolbar">
    <div class="view-title">
      <CalendarDays :size="18" />项目周期视图<span>{{ projects.length }} 个项目</span>
    </div>
    <div class="toolbar-right">
      <ElInput
        v-model="query"
        class="search-input"
        placeholder="搜索项目或成员…"
        aria-label="搜索项目或成员"
        clearable
        ><template #prefix><Search :size="16" /></template></ElInput
      ><ElButton
        class="outline export"
        @click="exportData"
        ><Download :size="15" />导出</ElButton
      >
    </div>
  </div>
  <div class="view-controls">
    <ElRadioGroup
      v-model="viewMode"
      aria-label="排期查看方式"
      size="small"
      ><ElRadioButton value="projects">按项目</ElRadioButton
      ><ElRadioButton value="people">按人员</ElRadioButton></ElRadioGroup
    >
    <ElSelect
      v-model="personFilter"
      placeholder="全部人员"
      clearable
      filterable
      aria-label="人员筛选"
      class="person-select"
      size="small"
      ><ElOption
        v-for="name in people"
        :key="name"
        :value="name"
        :label="name"
    /></ElSelect>
    <ElButton
      size="small"
      @click="showAllProjects"
      >全部项目</ElButton
    >
    <div class="conflict-settings">
      <span>重叠规则</span
      ><ElSelect
        v-model="conflictMode"
        aria-label="重叠规则"
        size="small"
        ><ElOption
          value="warn"
          label="冲突警告" /><ElOption
          value="block"
          label="禁止重叠" /></ElSelect
      ><ElTag
        v-if="conflicts.size"
        :type="conflictMode === 'block' ? 'danger' : 'warning'"
        >{{ conflicts.size }} 项排期冲突</ElTag
      >
    </div>
  </div>
  <div class="calendar-toolbar">
    <div class="month-nav">
      <ElButton
        text
        class="icon-btn"
        aria-label="上个月"
        @click="shiftMonth(-1)"
        ><ChevronLeft :size="17" /></ElButton
      ><ElDatePicker
        :model-value="month"
        class="month-picker"
        type="month"
        format="YYYY 年 M 月"
        value-format="YYYY-MM"
        :clearable="false"
        :editable="false"
        aria-label="选择月份"
        @update:model-value="setMonth"
      /><ElButton
        text
        class="icon-btn"
        aria-label="下个月"
        @click="shiftMonth(1)"
        ><ChevronRight :size="17" /></ElButton
      ><ElButton
        text
        class="today-btn"
        @click="setMonth(todayStr.slice(0, 7))"
        >今天</ElButton
      >
    </div>
    <div class="calendar-actions">
      <span class="drag-hint"><MousePointer2 :size="14" />拖拽调整排期 · 右键查看详情</span
      ><ElSelect
        v-model="dayWidth"
        class="zoom-select"
        aria-label="时间轴缩放"
        size="small"
        ><ElOption
          :value="44"
          label="标准视图" /><ElOption
          :value="30"
          label="紧凑视图" /><ElOption
          :value="64"
          label="宽松视图"
      /></ElSelect>
    </div>
  </div>
  <div class="range-toolbar">
    <span>查看范围</span>
    <ElDatePicker
      :model-value="rangeStart"
      type="date"
      format="YYYY-MM-DD"
      value-format="YYYY-MM-DD"
      :clearable="false"
      :disabled-date="(date: Date) => afterEnd(date, rangeEnd)"
      aria-label="查看开始日期"
      size="small"
      @update:model-value="(value: string) => setRange(value, rangeEnd)"
    />
    <span>至</span>
    <ElDatePicker
      :model-value="rangeEnd"
      type="date"
      format="YYYY-MM-DD"
      value-format="YYYY-MM-DD"
      :clearable="false"
      :disabled-date="(date: Date) => beforeStart(date, rangeStart)"
      aria-label="查看结束日期"
      size="small"
      @update:model-value="(value: string) => setRange(rangeStart, value)"
    />
    <span class="range-summary">共 {{ days.length }} 天 · 可跨月、跨年查看</span>
  </div>
</template>
