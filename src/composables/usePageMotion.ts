import { gsap } from 'gsap'
import { onBeforeUnmount, watch } from 'vue'
import type { Ref } from 'vue'

// Shared timing for page entrances, staggered layers, local results and dialogs.
export const PAGE_MOTION = {
  ease: 'power2.out',
  page: { duration: 0.45, offset: 16 },
  layer: { duration: 0.35, offset: 8, stagger: 0.06, start: 0.08 },
  result: { duration: 0.2, offset: 4, stagger: 0.03 },
  dialog: { duration: 0.25, offset: 8 },
} as const

type MotionRoot = Readonly<Ref<HTMLElement | undefined>>
type ResultMotion = { key: Readonly<Ref<unknown>>; selector: string }
interface MotionOptions {
  axis?: 'x' | 'y'
  pageKey?: Readonly<Ref<unknown>>
  layerSelector?: string
  resultSelector?: string
}

function useScopedMotion(
  root: MotionRoot,
  isDialog: boolean,
  resultMotions: readonly ResultMotion[],
  options: MotionOptions = {},
) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  const stopRoot = watch(
    root,
    (element, _, onCleanup) => {
      if (!element) return
      const container = element
      const axis = options.axis ?? 'y'
      const layerSelector =
        options.layerSelector ?? (isDialog ? '[data-dialog-layer]' : '[data-page-layer]')
      let entrance: gsap.core.Timeline | undefined
      let pageContext: gsap.Context | undefined
      const resultContexts = resultMotions.map(() => gsap.context(() => {}, container))

      function enter() {
        resultContexts.forEach((context) => context.revert())
        pageContext?.revert()
        entrance = undefined
        if (preference.matches) return
        pageContext = gsap.context(() => {
          const timing = isDialog ? PAGE_MOTION.dialog : PAGE_MOTION.page
          entrance = gsap
            .timeline({ defaults: { ease: PAGE_MOTION.ease, clearProps: 'opacity,transform' } })
            .from(container, { opacity: 0, [axis]: timing.offset, duration: timing.duration })
          const layers = container.querySelectorAll(layerSelector)
          if (layers.length) {
            entrance.from(
              layers,
              {
                opacity: 0,
                [axis]: PAGE_MOTION.layer.offset,
                duration: PAGE_MOTION.layer.duration,
                stagger: PAGE_MOTION.layer.stagger,
              },
              PAGE_MOTION.layer.start,
            )
          }
        }, container)
      }

      enter()
      const stops = resultMotions.map(({ key, selector }, index) =>
        watch(
          key,
          () => {
            // Complete the entrance before replaying only the changed result region.
            entrance?.progress(1).kill()
            const context = resultContexts[index]!
            context.revert()
            if (preference.matches) return
            context.add(() => {
              const targets = container.querySelectorAll(selector)
              if (!targets.length) return
              gsap.from(targets, {
                opacity: 0,
                [axis]: PAGE_MOTION.result.offset,
                duration: PAGE_MOTION.result.duration,
                stagger: PAGE_MOTION.result.stagger,
                ease: PAGE_MOTION.ease,
                clearProps: 'opacity,transform',
              })
            })
          },
          { flush: 'post' },
        ),
      )
      if (options.pageKey) stops.push(watch(options.pageKey, enter, { flush: 'post' }))
      preference.addEventListener('change', enter)
      onCleanup(() => {
        stops.forEach((stop) => stop())
        preference.removeEventListener('change', enter)
        resultContexts.forEach((context) => context.revert())
        pageContext?.revert()
      })
    },
    { flush: 'post', immediate: true },
  )
  onBeforeUnmount(stopRoot)
}

export function usePageMotion(
  root: MotionRoot,
  resultKey?: Readonly<Ref<unknown>>,
  options: MotionOptions = {},
) {
  useScopedMotion(
    root,
    false,
    resultKey ? [{ key: resultKey, selector: options.resultSelector ?? '[data-page-result]' }] : [],
    options,
  )
}

export function useDialogMotion(
  root: MotionRoot,
  resultKey?: Readonly<Ref<unknown>> | readonly ResultMotion[],
) {
  const motions = !resultKey
    ? []
    : 'value' in resultKey
      ? [{ key: resultKey, selector: '[data-dialog-result]' }]
      : resultKey
  useScopedMotion(root, true, motions)
}
