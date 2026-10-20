import { ref, watch } from 'vue'

export function useTimelineViewport() {
  const timelineViewport = ref<HTMLElement>()
  const timelineHeading = ref<HTMLElement>()
  const availableTimelineWidth = ref(0)

  watch(
    [timelineViewport, timelineHeading],
    ([viewport, heading], _, onCleanup) => {
      if (!viewport || !heading) return
      function measure() {
        availableTimelineWidth.value = Math.max(
          0,
          viewport!.clientWidth - heading!.getBoundingClientRect().width,
        )
      }
      measure()
      const observer = new ResizeObserver(measure)
      observer.observe(viewport)
      observer.observe(heading)
      onCleanup(() => observer.disconnect())
    },
    { flush: 'post' },
  )

  return { timelineViewport, timelineHeading, availableTimelineWidth }
}
