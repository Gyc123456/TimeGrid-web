<script setup lang="ts">
import { useTimeGridContext } from '../../composables/timeGridContext'
const { afterEnd, beforeStart, editingProject, error, form, iconLoading, modal, save } =
  useTimeGridContext()
import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
} from 'element-plus'
import { Plus } from 'lucide-vue-next'
import ProjectIconPicker from '../../components/projects/ProjectIconPicker.vue'
</script>
<template>
  <ElDialog
    :model-value="modal !== null"
    :title="modal === 'project' ? (editingProject ? '修改项目' : '创建新项目') : '添加项目成员'"
    width="460px"
    class="edit-dialog"
    align-center
    destroy-on-close
    @update:model-value="
      (value) => {
        if (!value) modal = null
      }
    "
  >
    <p class="dialog-intro">
      {{
        modal === 'project'
          ? '给新计划一个名字，并设置项目起止日期。'
          : '为成员设置排期，之后也可在时间轴上拖拽调整。'
      }}
    </p>
    <ElForm
      :model="form"
      label-position="top"
      @submit.prevent="save"
    >
      <ElFormItem
        :label="modal === 'project' ? '项目名称' : '成员姓名'"
        required
        ><ElInput
          v-model="form.name"
          maxlength="40"
          :placeholder="modal === 'project' ? '例如：品牌官网改版' : '输入姓名'"
          :aria-label="modal === 'project' ? '项目名称' : '成员姓名'"
      /></ElFormItem>
      <ElFormItem
        v-if="modal === 'member'"
        label="项目角色"
        ><ElInput
          v-model="form.role"
          placeholder="例如：产品设计师"
          maxlength="30"
          aria-label="项目角色"
      /></ElFormItem>
      <div class="date-fields">
        <ElFormItem
          label="开始日期"
          required
          ><ElDatePicker
            v-model="form.start"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            :disabled-date="(date: Date) => afterEnd(date, form.end)"
            aria-label="开始日期"
        /></ElFormItem>
        <ElFormItem
          label="结束日期"
          required
          ><ElDatePicker
            v-model="form.end"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :clearable="false"
            :disabled-date="(date: Date) => beforeStart(date, form.start)"
            aria-label="结束日期"
        /></ElFormItem>
      </div>
      <ElFormItem
        v-if="modal === 'project'"
        label="项目图标"
      >
        <ProjectIconPicker />
      </ElFormItem>
      <ElAlert
        v-if="error"
        :title="error"
        type="error"
        :closable="false"
        show-icon
      />
    </ElForm>
    <template #footer
      ><ElButton @click="modal = null">取消</ElButton
      ><ElButton
        type="primary"
        :loading="iconLoading"
        @click="save"
        ><Plus :size="16" />{{
          modal === 'project' ? (editingProject ? '保存修改' : '创建项目') : '添加成员'
        }}</ElButton
      ></template
    >
  </ElDialog>
</template>
