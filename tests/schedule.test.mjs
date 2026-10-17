import test from 'node:test'
import assert from 'node:assert/strict'
import { daysBetween, endFromDuration, validRange } from '../src/utils/schedule.ts'

test('包含首尾日期，并支持跨月、跨年和闰年', () => {
  assert.equal(daysBetween('2026-10-17', '2026-10-17'), 1)
  assert.equal(daysBetween('2026-12-31', '2027-01-02'), 3)
  assert.equal(daysBetween('2028-02-28', '2028-03-01'), 3)
  assert.equal(endFromDuration('2028-02-28', 3), '2028-03-01')
})
test('更改时长保留开始日期，日期与时长可往返计算', () => {
  for (const start of ['2026-01-31', '2026-12-31', '2028-02-28']) {
    for (const days of [1, 2, 7, 30, 365, 36500]) {
      const end = endFromDuration(start, days)
      assert.equal(daysBetween(start, end), days)
    }
  }
})
test('拒绝无效日期、倒序日期及无效时长', () => {
  assert.equal(validRange('2026-02-30', '2026-03-05'), false)
  assert.equal(validRange('2026-10-20', '2026-10-19'), false)
  assert.equal(daysBetween('', '2026-10-19'), 0)
  for (const days of [0, -1, 1.5, NaN, Infinity, 36501])
    assert.equal(endFromDuration('2026-10-17', days), null)
})

import { overlaps, conflictIds, checkChange } from '../src/utils/schedule.ts'
const row = (id, name, start, end) => ({ id, name, start, end })
test('同一人员跨项目重叠，包含相同端点，不同人员不冲突', () => {
  const a = row('a', '林晓', '2026-10-03', '2026-10-12')
  assert.equal(overlaps(a, row('b', '林晓', '2026-10-12', '2026-10-20')), true)
  assert.equal(overlaps(a, row('b', '林晓', '2026-10-13', '2026-10-20')), false)
  assert.equal(overlaps(a, row('b', '陈宇', '2026-10-03', '2026-10-12')), false)
  assert.equal(overlaps(a, a), false)
  assert.equal(overlaps(a, row('b', ' 林晓 ', '2026-10-05', '2026-10-06')), true)
})
test('冲突双方均标记，独立排期不标记', () => {
  const rows = [
    row('a', '林晓', '2026-10-03', '2026-10-12'),
    row('b', '林晓', '2026-10-12', '2026-10-20'),
    row('c', '林晓', '2026-10-21', '2026-10-25'),
  ]
  assert.deepEqual([...conflictIds(rows)].sort(), ['a', 'b'])
})
test('禁止策略拒绝候选排期且不改变原数据，警告策略允许候选排期', () => {
  const original = row('a', '林晓', '2026-10-03', '2026-10-12')
  const rows = [original, row('b', '林晓', '2026-10-13', '2026-10-20')]
  const candidate = { ...original, end: '2026-10-13' }
  assert.equal(checkChange(candidate, rows, 'block').allowed, false)
  assert.equal(checkChange(candidate, rows, 'warn').allowed, true)
  assert.equal(original.end, '2026-10-12')
  assert.equal(checkChange({ ...original, end: '2026-10-11' }, rows, 'block').allowed, true)
})

import { timelineDates } from '../src/utils/schedule.ts'
test('查看范围连续覆盖跨月、跨年和闰日，包含首尾日期', () => {
  assert.deepEqual(timelineDates('2026-10-30', '2026-11-02'), [
    '2026-10-30',
    '2026-10-31',
    '2026-11-01',
    '2026-11-02',
  ])
  assert.deepEqual(timelineDates('2026-12-31', '2027-01-02'), [
    '2026-12-31',
    '2027-01-01',
    '2027-01-02',
  ])
  assert.deepEqual(timelineDates('2028-02-28', '2028-03-01'), [
    '2028-02-28',
    '2028-02-29',
    '2028-03-01',
  ])
  assert.deepEqual(timelineDates('2026-10-17', '2026-10-17'), ['2026-10-17'])
  assert.deepEqual(timelineDates('2026-11-01', '2026-10-01'), [])
})

import { completionStatus } from '../src/utils/schedule.ts'
test('完成状态按进度和截止日期联动，结束当天不滞后，已完成优先', () => {
  assert.equal(completionStatus(0, '2026-10-17', '2026-10-17'), '未开始')
  assert.equal(completionStatus(50, '2026-10-17', '2026-10-17'), '进行中')
  assert.equal(completionStatus(0, '2026-10-16', '2026-10-17'), '滞后')
  assert.equal(completionStatus(99, '2026-10-16', '2026-10-17'), '滞后')
  assert.equal(completionStatus(100, '2026-10-16', '2026-10-17'), '已完成')
  assert.equal(completionStatus(50, '2027-01-01', '2026-12-31'), '进行中')
})
