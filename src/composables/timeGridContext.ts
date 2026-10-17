import { inject } from 'vue'
import type { InjectionKey } from 'vue'
import type { useTimeGrid } from './useTimeGrid'
export const timeGridKey: InjectionKey<ReturnType<typeof useTimeGrid>> = Symbol('TimeGrid')
export function useTimeGridContext() {
  const context = inject(timeGridKey)
  if (!context) throw new Error('TimeGrid provider is missing')
  return context
}
