<script setup lang="ts">
import { useTimeGridContext } from '../../composables/timeGridContext'
const { chooseProjectIcon, form, iconLoading, uploadProjectIcon } = useTimeGridContext()
import { ElButton, ElColorPicker, ElUpload } from 'element-plus'
import { projectIcon, palette, projectIcons, projectStyle } from '../../config/projectAppearance'
</script>
<template>
  <div class="project-icon-controls">
    <span
      class="project-icon icon-preview"
      :style="projectStyle(form)"
      ><img
        v-if="form.icon"
        :src="form.icon"
        alt="项目图标预览" /><component
        :is="projectIcon(form)"
        v-else
        :size="24" /></span
    ><ElUpload
      class="project-icon-upload"
      :auto-upload="false"
      :show-file-list="false"
      accept="image/png,image/jpeg,image/webp,image/gif"
      :on-change="uploadProjectIcon"
      :disabled="iconLoading"
      ><ElButton :loading="iconLoading">上传图标</ElButton></ElUpload
    >
    <div class="project-icon-color">
      <span>颜色</span
      ><ElColorPicker
        v-model="form.color"
        color-format="hex"
        :predefine="Object.values(palette)"
        aria-label="图标颜色"
      />
    </div>
  </div>
  <ElButton
    v-if="form.icon"
    class="reset-project-icon"
    link
    @click="form.icon = ''"
    >使用内置图标</ElButton
  >
  <div
    class="project-icon-library"
    role="group"
    aria-label="内置项目图标"
    :style="projectStyle(form)"
  >
    <ElButton
      v-for="icon in projectIcons"
      :key="icon.key"
      class="icon-choice"
      :class="{ chosen: !form.icon && form.iconKey === icon.key }"
      :aria-pressed="!form.icon && form.iconKey === icon.key"
      :aria-label="'选择' + icon.label + '图标'"
      :disabled="iconLoading"
      @click="chooseProjectIcon(icon.key)"
      ><component
        :is="icon.component"
        :size="20"
      /><span>{{ icon.label }}</span></ElButton
    >
  </div>
  <small class="field-hint"
    >支持 PNG、JPG、WebP、GIF，最大 512 KB；调色盘设置默认图标及排期颜色。</small
  >
</template>
