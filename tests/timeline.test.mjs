import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, nextTick } from 'vue'
import { useTimelineViewport } from '../src/composables/useTimelineViewport.ts'
import {
  calendarRange,
  fitTimelineColumnWidth,
  timelineColumns,
  timelineSpan,
} from '../src/utils/timeline.ts'

test('根据容器和固定信息列的实际宽度适配，并在卸载时停止观察', async (context) => {
  const originalObserver = globalThis.ResizeObserver
  const observers = []
  globalThis.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback
      this.targets = []
      this.disconnected = false
      observers.push(this)
    }
    observe(target) {
      this.targets.push(target)
    }
    disconnect() {
      this.disconnected = true
    }
  }
  const scope = effectScope()
  context.after(() => {
    scope.stop()
    if (originalObserver) globalThis.ResizeObserver = originalObserver
    else delete globalThis.ResizeObserver
  })
  const view = scope.run(useTimelineViewport)
  let containerWidth = 2200
  let headingWidth = 440
  view.timelineViewport.value = {
    get clientWidth() {
      return containerWidth
    },
  }
  view.timelineHeading.value = { getBoundingClientRect: () => ({ width: headingWidth }) }
  await nextTick()
  const observer = observers[0]
  assert.equal(view.availableTimelineWidth.value, 1760)
  assert.equal(observer.targets.length, 2)
  containerWidth = 1800
  headingWidth = 400
  observer.callback()
  assert.equal(view.availableTimelineWidth.value, 1400)
  scope.stop()
  assert.equal(observer.disconnected, true)
})

test('年视图均分可用宽度，窗口缩放后网格和时间条保持对齐', () => {
  const columns = timelineColumns('2026-01-01', '2026-12-31', 'year')
  for (const availableWidth of [720, 936, 1440, 1800, 2000.5]) {
    const width = fitTimelineColumnWidth(availableWidth, columns.length)
    assert.ok(Math.abs(width * columns.length - availableWidth) < 1e-9)
    const fullYear = timelineSpan('2026-01-01', '2026-12-31', columns, width)
    assert.ok(Math.abs(fullYear.width - availableWidth) < 1e-9)
    const october = timelineSpan('2026-10-01', '2026-10-31', columns, width)
    assert.ok(Math.abs(october.left - width * 9) < 1e-9)
    assert.ok(Math.abs(october.width - width) < 1e-9)
  }
})

test('窄屏年视图保留可读的最小月宽，通过横向滚动查看', () => {
  for (const availableWidth of [0, 150, 600]) {
    assert.equal(fitTimelineColumnWidth(availableWidth, 12), 60)
  }
  assert.equal(fitTimelineColumnWidth(1000, 0), 60)
})

test('月视图在宽屏均分可用宽度，闰月和跨月范围的时间条保持对齐', () => {
  for (const [start, end] of [
    ['2026-10-01', '2026-10-31'],
    ['2028-02-01', '2028-02-29'],
    ['2026-12-25', '2027-01-10'],
  ]) {
    const columns = timelineColumns(start, end, 'month')
    for (const availableWidth of [2000, 2400.5]) {
      const width = fitTimelineColumnWidth(availableWidth, columns.length, 44)
      assert.ok(Math.abs(width * columns.length - availableWidth) < 1e-9)
      const fullRange = timelineSpan(start, end, columns, width)
      assert.ok(Math.abs(fullRange.width - availableWidth) < 1e-9)
      const secondDay = timelineSpan(columns[1].date, columns[1].end, columns, width)
      assert.ok(Math.abs(secondDay.left - width) < 1e-9)
      assert.ok(Math.abs(secondDay.width - width) < 1e-9)
    }
  }
})

test('月视图保留缩放设置作为最小列宽，较长范围仍可横向滚动', () => {
  for (const minimumWidth of [30, 44, 64]) {
    assert.equal(fitTimelineColumnWidth(600, 31, minimumWidth), minimumWidth)
    assert.equal(fitTimelineColumnWidth(0, 0, minimumWidth), minimumWidth)
  }
})

test('年视图覆盖完整年份，月视图覆盖完整月份，包括闰年', () => {
  assert.deepEqual(calendarRange('2028', 'year'), { start: '2028-01-01', end: '2028-12-31' })
  assert.deepEqual(calendarRange('2028-02', 'month'), { start: '2028-02-01', end: '2028-02-29' })
  assert.deepEqual(calendarRange('2026-02', 'month'), { start: '2026-02-01', end: '2026-02-28' })
  for (const value of ['', '2026-13', '2026-00', '2026-02-01']) {
    assert.equal(calendarRange(value, 'month'), null)
  }
  assert.equal(calendarRange('2026-02', 'year'), null)
})

test('年视图只有 12 个等宽月份，月视图仍按天展示', () => {
  const columns = timelineColumns('2028-01-01', '2028-12-31', 'year')
  assert.equal(columns.length, 12)
  assert.equal(columns[0].label, '1月')
  assert.equal(columns[11].label, '12月')
  assert.equal(columns[1].end, '2028-02-29')
  assert.equal(columns[11].end, '2028-12-31')
  assert.ok(columns.every((column) => !column.weekend && column.caption === '2028年'))
  const days = timelineColumns('2028-02-28', '2028-03-02', 'month')
  assert.deepEqual(
    days.map((column) => column.date),
    ['2028-02-28', '2028-02-29', '2028-03-01', '2028-03-02'],
  )
  assert.equal(days[2].label, '3/1')
  assert.deepEqual(timelineSpan('2028-02-29', '2028-03-01', days, 44), { left: 44, width: 88 })
})

test('年视图按各月实际天数定位，整月等宽，月中日期及单日不丢失', () => {
  const columns = timelineColumns('2028-01-01', '2028-12-31', 'year')
  assert.deepEqual(timelineSpan('2028-01-01', '2028-01-31', columns, 88), { left: 0, width: 88 })
  assert.deepEqual(timelineSpan('2028-02-01', '2028-02-29', columns, 88), { left: 88, width: 88 })
  assert.deepEqual(timelineSpan('2028-03-01', '2028-03-31', columns, 88), { left: 176, width: 88 })
  assert.deepEqual(timelineSpan('2028-01-01', '2028-12-31', columns, 88), { left: 0, width: 1056 })
  const singleDay = timelineSpan('2028-02-29', '2028-02-29', columns, 88)
  assert.ok(Math.abs(singleDay.left - (88 + (28 / 29) * 88)) < 1e-9)
  assert.ok(Math.abs(singleDay.width - 88 / 29) < 1e-9)
  const crossMonth = timelineSpan('2028-01-16', '2028-02-14', columns, 88)
  assert.ok(Math.abs(crossMonth.left - (15 / 31) * 88) < 1e-9)
  assert.ok(Math.abs(crossMonth.width - (16 / 31 + 14 / 29) * 88) < 1e-9)
})

test('跨年项目在可见年份边界裁切，未相交项目隐藏，原始日期保持不变', () => {
  const columns = timelineColumns('2026-01-01', '2026-12-31', 'year')
  const project = { start: '2025-12-15', end: '2027-01-15' }
  assert.deepEqual(timelineSpan(project.start, project.end, columns, 88), { left: 0, width: 1056 })
  assert.deepEqual(project, { start: '2025-12-15', end: '2027-01-15' })
  assert.equal(timelineSpan('2025-01-01', '2025-12-31', columns, 88), null)
  assert.equal(timelineSpan('2027-01-01', '2027-12-31', columns, 88), null)
  assert.equal(timelineSpan('2026-02-30', '2026-03-01', columns, 88), null)
  assert.equal(timelineSpan('2026-01-01', '2026-01-02', [], 88), null)
})

test('跨月跨年范围及日期边界可安全生成月刻度', () => {
  const columns = timelineColumns('2026-12-15', '2027-02-05', 'year')
  assert.deepEqual(
    columns.map(({ date, end }) => [date, end]),
    [
      ['2026-12-15', '2026-12-31'],
      ['2027-01-01', '2027-01-31'],
      ['2027-02-01', '2027-02-05'],
    ],
  )
  assert.deepEqual(timelineSpan('2026-01-01', '2028-01-01', columns, 88), { left: 0, width: 264 })
  assert.equal(timelineColumns('9999-01-01', '9999-12-31', 'year').length, 12)
  assert.deepEqual(timelineColumns('2026-02-30', '2026-03-05', 'year'), [])
})
