<script setup lang="ts">
import { useTimeGridContext } from '../../composables/timeGridContext'
const {
  afterEnd,
  barStyle,
  beforeStart,
  begin,
  bounds,
  collapsed,
  conflictMode,
  conflicts,
  dayWidth,
  days,
  displayed,
  dragging,
  duration,
  editDate,
  ganttElement,
  inView,
  notice,
  openDetails,
  openModal,
  openProjectMenu,
  owner,
  query,
  scheduleCard,
  timelineWidth,
  todayStr,
  toggle,
  viewMode,
} = useTimeGridContext()
import { ElAlert, ElAvatar, ElButton, ElDatePicker, ElEmpty } from 'element-plus'
import { ChevronDown, Plus, Trash2 } from 'lucide-vue-next'
import { projectIcon, projectStyle } from '../../config/projectAppearance'
import ScheduleToolbar from '../../components/schedule/ScheduleToolbar.vue'
</script>
<template>
  <div
    ref="scheduleCard"
    class="schedule-card"
  >
    <ScheduleToolbar />
    <ElAlert
      v-if="notice"
      :title="notice"
      type="warning"
      show-icon
      @close="notice = ''"
    />
    <div class="gantt-scroll">
      <div
        ref="ganttElement"
        class="gantt"
        :style="{ '--timeline-width': timelineWidth + 'px', '--day-width': dayWidth + 'px' }"
      >
        <div class="table-head sticky-left">
          <span>{{ viewMode === 'projects' ? '项目 / 参与成员' : '人员 / 参与项目' }}</span
          ><span>开始日期</span><span>结束日期</span>
        </div>
        <div class="date-header">
          <div
            v-for="d in days"
            :key="d.date"
            class="date-cell"
            :class="{ weekend: d.weekend, today: d.date === todayStr }"
          >
            <span>{{ d.week }}</span
            ><strong :title="d.date">{{ d.label }}</strong>
          </div>
        </div>
        <template
          v-for="p in displayed"
          :key="p.id"
        >
          <div
            class="project-cell sticky-left"
            @contextmenu.prevent="openProjectMenu($event, p)"
          >
            <ElButton
              text
              class="project-name"
              :aria-expanded="!collapsed.has(p.id)"
              @click="toggle(p.id)"
              ><ChevronDown
                :size="15"
                :class="{ closed: collapsed.has(p.id) }"
              /><span
                class="project-symbol project-icon"
                :style="projectStyle(p)"
                ><img
                  v-if="p.icon"
                  :src="p.icon"
                  alt="" /><component
                  :is="projectIcon(p)"
                  v-else
                  :size="15" /></span
              ><strong>{{ p.name }}</strong
              ><span class="count">{{ p.members.length }}</span></ElButton
            ><ElButton
              v-if="viewMode === 'projects'"
              text
              class="icon-btn"
              :aria-label="'为' + p.name + '添加成员'"
              @click="openModal('member', p.id)"
              ><Plus :size="16"
            /></ElButton>
          </div>
          <div class="project-timeline">
            <span>{{ bounds(p) }}</span
            ><span>{{ p.members.length }} {{ viewMode === 'projects' ? '位成员' : '项排期' }}</span>
          </div>
          <template v-if="!collapsed.has(p.id)">
            <template
              v-for="m in p.members"
              :key="m.id"
            >
              <div
                class="member-cell sticky-left"
                @contextmenu.prevent="openDetails(owner(m).id, m)"
              >
                <div class="member-info">
                  <ElAvatar
                    class="avatar"
                    :style="projectStyle(owner(m))"
                    :size="29"
                    >{{ m.name.slice(-1) }}</ElAvatar
                  >
                  <div>
                    <strong>{{ viewMode === 'projects' ? m.name : owner(m).name }}</strong
                    ><small>{{ viewMode === 'projects' ? m.role : m.name }}</small>
                  </div>
                  <ElButton
                    text
                    class="remove-member"
                    :aria-label="'移除' + m.name"
                    @click="owner(m).members = owner(m).members.filter((x) => x.id !== m.id)"
                    ><Trash2 :size="13"
                  /></ElButton>
                </div>
                <ElDatePicker
                  :model-value="m.start"
                  type="date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :clearable="false"
                  :editable="false"
                  :disabled-date="(date: Date) => afterEnd(date, m.end)"
                  :aria-label="m.name + '开始日期'"
                  size="small"
                  class="row-date"
                  @update:model-value="(value) => editDate(m, 'start', value)"
                /><ElDatePicker
                  :model-value="m.end"
                  type="date"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :clearable="false"
                  :editable="false"
                  :disabled-date="(date: Date) => beforeStart(date, m.start)"
                  :aria-label="m.name + '结束日期'"
                  size="small"
                  class="row-date"
                  @update:model-value="(value) => editDate(m, 'end', value)"
                />
              </div>
              <div
                class="member-timeline"
                @contextmenu.prevent="openDetails(owner(m).id, m)"
              >
                <div class="grid-days">
                  <div
                    v-for="d in days"
                    :key="d.date"
                    :class="{ weekend: d.weekend, 'today-column': d.date === todayStr }"
                  ></div>
                </div>
                <div
                  v-if="inView(m)"
                  class="task-bar"
                  role="button"
                  tabindex="0"
                  :aria-label="m.name + '排期详情'"
                  :class="[
                    owner(m).color,
                    {
                      dragging: dragging === m.id,
                      'has-conflict': conflicts.has(m.id),
                      'blocked-conflict': conflictMode === 'block' && conflicts.has(m.id),
                    },
                  ]"
                  :data-member-id="m.id"
                  :style="barStyle(m)"
                  :title="`${m.name} · ${m.start} 至 ${m.end} · ${duration(m)} 天。\n拖动移动，拖动两端调整；右键查看详情。`"
                  @keydown.enter.prevent="openDetails(owner(m).id, m)"
                  @keydown.space.prevent="openDetails(owner(m).id, m)"
                  @dblclick="openDetails(owner(m).id, m)"
                  @pointerdown="begin($event, m, 'move')"
                >
                  <span
                    v-if="m.start >= days[0]!.date"
                    class="resize-handle left"
                    @pointerdown.stop="begin($event, m, 'start')"
                  ></span
                  ><span class="bar-label"
                    >{{ conflicts.has(m.id) ? '⚠ ' : ''
                    }}{{ viewMode === 'projects' ? m.name : owner(m).name
                    }}<span>· {{ duration(m) }} 天</span></span
                  ><span
                    v-if="m.end <= days.at(-1)!.date"
                    class="resize-handle right"
                    @pointerdown.stop="begin($event, m, 'end')"
                  ></span>
                </div>
              </div>
            </template>
            <div
              v-if="viewMode === 'projects'"
              class="add-member sticky-left"
            >
              <ElButton
                text
                @click="openModal('member', p.id)"
                ><Plus :size="14" />添加成员</ElButton
              >
            </div>
            <div
              v-if="viewMode === 'projects'"
              class="empty-timeline"
            ></div>
          </template>
        </template>
      </div>
      <ElEmpty
        v-if="!displayed.length"
        :description="query ? '没有找到匹配的项目或成员' : '从第一个项目开始'"
        :image-size="70"
        ><ElButton @click="query ? (query = '') : openModal('project')">{{
          query ? '清除搜索' : '新建项目'
        }}</ElButton></ElEmpty
      >
    </div>
    <div class="table-footer">
      <span><span class="legend-square"></span>周末<span class="legend-line"></span>今天</span
      ><span>每位成员一行 · 日期精确到天</span>
    </div>
  </div>
</template>
