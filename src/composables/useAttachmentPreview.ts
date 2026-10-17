import { ref, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import type { Attachment } from '../types/project'
export function useAttachmentPreview() {
  const attachmentPreview = ref<{
    file: Attachment
    kind: string
    url: string
    text: string
  } | null>(null)
  function closePreview() {
    if (attachmentPreview.value?.url) URL.revokeObjectURL(attachmentPreview.value.url)
    attachmentPreview.value = null
  }
  function previewAttachment(file: Attachment) {
    closePreview()
    try {
      const match = /^data:([^;,]*)(?:;[^,]*)?;base64,(.*)$/s.exec(file.data)
      if (!match) throw Error('invalid attachment')
      const bytes = Uint8Array.from(atob(match[2]!), (c) => c.charCodeAt(0))
      const ext = file.name.split('.').at(-1)?.toLowerCase() || ''
      const mime = match[1] || ''
      const imageTypes: Record<string, string> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        avif: 'image/avif',
      }
      let kind = 'unsupported',
        type = 'application/octet-stream'
      if (imageTypes[ext]) {
        kind = 'image'
        type = imageTypes[ext]!
      } else if (ext === 'pdf') {
        kind = 'pdf'
        type = 'application/pdf'
      } else if (
        [
          'txt',
          'md',
          'json',
          'csv',
          'log',
          'xml',
          'html',
          'css',
          'js',
          'ts',
          'yaml',
          'yml',
        ].includes(ext) ||
        mime.startsWith('text/')
      )
        kind = 'text'
      else if (['mp4', 'webm'].includes(ext)) {
        kind = 'video'
        type = ext === 'mp4' ? 'video/mp4' : 'video/webm'
      } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
        kind = 'audio'
        type = ext === 'mp3' ? 'audio/mpeg' : ext === 'wav' ? 'audio/wav' : 'audio/ogg'
      }
      attachmentPreview.value = {
        file,
        kind,
        url:
          kind === 'text' || kind === 'unsupported'
            ? ''
            : URL.createObjectURL(new Blob([bytes], { type })),
        text: kind === 'text' ? new TextDecoder().decode(bytes) : '',
      }
    } catch {
      ElMessage.error('附件无法读取，请重新上传。')
    }
  }
  function downloadAttachment(file: Attachment) {
    const a = document.createElement('a')
    a.href = file.data
    a.download = file.name
    a.click()
  }
  onBeforeUnmount(closePreview)
  return { attachmentPreview, closePreview, previewAttachment, downloadAttachment }
}
