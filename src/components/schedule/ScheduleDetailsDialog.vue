<script setup lang="ts">
import { ref } from 'vue'
import { useDialogMotion } from '../../composables/usePageMotion'
const motionRoot = ref<HTMLElement>()
useDialogMotion(motionRoot)
import { useTimeGridContext } from '../../composables/timeGridContext'
const {
  afterEnd,
  beforeStart,
  detail,
  detailError,
  detailStatus,
  previewAttachment,
  readingFiles,
  saveDetails,
  syncDates,
  syncDuration,
  uploadAttachment,
} = useTimeGridContext()
import {
  ElAlert,
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElSlider,
  ElTag,
  ElUpload,
} from 'element-plus'
import { Check, Download, Plus } from 'lucide-vue-next'
</script>
<template>
  <ElDialog
    :model-value="detail !== null"
    title="排期详情"
    width="520px"
    class="details-dialog"
    align-center
    destroy-on-close
    :close-on-click-modal="!readingFiles"
    :close-on-press-escape="!readingFiles"
    :show-close="!readingFiles"
    @update:model-value="
      (value) => {
        if (!value && !readingFiles) detail = null
      }
    "
  >
    <template v-if="detail">
      <div ref="motionRoot">
        <p class="dialog-intro">调整日期自动计算时长；调整时长将保留开始日期并更新结束日期。</p>
        <ElForm
          :model="detail"
          label-position="top"
          @submit.prevent="saveDetails"
        >
          <ElFormItem label="人员姓名"
            ><ElInput
              :model-value="detail.name"
              readonly
              aria-label="人员姓名"
          /></ElFormItem>
          <div class="date-fields">
            <ElFormItem
              data-dialog-layer
              label="开始日期"
              required
              ><ElDatePicker
                v-model="detail.start"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :clearable="false"
                :disabled-date="(date: Date) => afterEnd(date, detail!.end)"
                aria-label="开始日期"
                @change="syncDates"
            /></ElFormItem>
            <ElFormItem
              data-dialog-layer
              label="结束日期"
              required
              ><ElDatePicker
                v-model="detail.end"
                type="date"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :clearable="false"
                :disabled-date="(date: Date) => beforeStart(date, detail!.start)"
                aria-label="结束日期"
                @change="syncDates"
            /></ElFormItem>
          </div>
          <ElFormItem
            data-dialog-layer
            label="工作时长（天）"
            required
            ><ElInputNumber
              class="duration-input"
              :model-value="detail.days"
              :min="1"
              :max="36500"
              :precision="0"
              :step="1"
              controls-position="right"
              aria-label="工作时长（天）"
              @update:model-value="syncDuration"
            /><small class="field-hint">按自然日计算，包含开始及结束当天。</small></ElFormItem
          >
          <ElFormItem label="开发进度">
            <div
              class="detail-progress"
              :class="{
                'is-complete': detailStatus === '已完成',
                'is-late': detailStatus === '滞后',
              }"
            >
              <ElSlider
                v-model="detail.progress"
                :min="0"
                :max="100"
                :step="1"
                :format-tooltip="(value: number) => `${value}%`"
                aria-label="开发进度"
              />
              <span class="detail-progress-value">{{ detail.progress }}%</span>
            </div>
          </ElFormItem>
          <ElFormItem label="完成情况"
            ><ElTag
              :type="
                detailStatus === '滞后'
                  ? 'danger'
                  : detailStatus === '已完成'
                    ? 'success'
                    : detailStatus === '进行中'
                      ? 'primary'
                      : 'info'
              "
              >{{ detailStatus }}</ElTag
            ><small class="field-hint">超过结束日期且进度未满 100% 时显示滞后。</small></ElFormItem
          >
          <ElFormItem label="上传附件">
            <ElUpload
              :key="detail.memberId"
              class="attachment-upload"
              :auto-upload="false"
              :show-file-list="false"
              multiple
              :disabled="readingFiles"
              :on-change="uploadAttachment"
            >
              <ElButton
                :loading="readingFiles"
                :disabled="readingFiles"
                ><Plus :size="16" />选择附件</ElButton
              >
              <template #tip
                ><div class="el-upload__tip">
                  附件保存在当前浏览器；单个 ≤ 1 MB，合计 ≤ 2 MB。
                </div></template
              >
            </ElUpload>
            <div class="attachment-tags">
              <ElTag
                v-for="file in detail.attachments"
                :key="file.id"
                :closable="!readingFiles"
                @close="detail.attachments = detail.attachments.filter((a) => a.id !== file.id)"
                ><ElButton
                  link
                  class="attachment-name"
                  :title="'预览 ' + file.name"
                  @click="previewAttachment(file)"
                  ><Download :size="13" /><span>{{ file.name }}</span></ElButton
                ><small>{{ (file.size / 1024).toFixed(1) }} KB</small></ElTag
              >
            </div>
          </ElFormItem>
          <ElFormItem label="备注"
            ><ElInput
              v-model="detail.notes"
              type="textarea"
              :rows="3"
              maxlength="5000"
              show-word-limit
              placeholder="补充工作内容、交付说明…"
              aria-label="备注"
          /></ElFormItem>
          <ElAlert
            v-if="detailError"
            :title="detailError"
            type="error"
            :closable="false"
            show-icon
          />
        </ElForm>
      </div>
    </template>
    <template #footer
      ><ElButton
        :disabled="readingFiles"
        @click="detail = null"
        >取消</ElButton
      ><ElButton
        type="primary"
        :loading="readingFiles"
        @click="saveDetails"
        ><Check :size="16" />保存详情</ElButton
      ></template
    >
  </ElDialog>
</template>
