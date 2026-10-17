<script setup lang="ts">
import { useTimeGridContext } from '../../composables/timeGridContext'
const { attachmentPreview, closePreview, downloadAttachment } = useTimeGridContext()
import { ElButton, ElDialog, ElEmpty } from 'element-plus'
import { Download } from 'lucide-vue-next'
</script>
<template>
  <ElDialog
    :model-value="attachmentPreview !== null"
    :title="attachmentPreview?.file.name || '附件预览'"
    width="900px"
    class="preview-dialog"
    append-to-body
    align-center
    destroy-on-close
    @update:model-value="
      (value) => {
        if (!value) closePreview()
      }
    "
  >
    <template v-if="attachmentPreview">
      <img
        v-if="attachmentPreview.kind === 'image'"
        class="preview-image"
        :src="attachmentPreview.url"
        :alt="attachmentPreview.file.name"
      />
      <iframe
        v-else-if="attachmentPreview.kind === 'pdf'"
        class="preview-frame"
        :src="attachmentPreview.url"
        title="PDF 附件预览"
        sandbox="allow-same-origin"
      />
      <pre
        v-else-if="attachmentPreview.kind === 'text'"
        class="preview-text"
        >{{ attachmentPreview.text }}</pre>
      <video
        v-else-if="attachmentPreview.kind === 'video'"
        :src="attachmentPreview.url"
        controls
        class="preview-video"
      />
      <audio
        v-else-if="attachmentPreview.kind === 'audio'"
        :src="attachmentPreview.url"
        controls
      />
      <ElEmpty
        v-else
        description="此格式暂不支持在线预览，请下载后查看。"
      />
    </template>
    <template #footer
      ><ElButton @click="closePreview">关闭</ElButton
      ><ElButton
        v-if="attachmentPreview"
        type="primary"
        @click="downloadAttachment(attachmentPreview.file)"
        ><Download :size="15" />下载附件</ElButton
      ></template
    >
  </ElDialog>
</template>
