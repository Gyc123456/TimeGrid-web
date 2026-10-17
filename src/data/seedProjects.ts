import type { Project } from '../types/project'
import { iso } from '../utils/schedule'
export function createSeedProjects(today: Date): Project[] {
  const dateAt = (day: number) => iso(Date.UTC(today.getFullYear(), today.getMonth(), day))
  const seed: Project[] = [
    {
      id: 'p1',
      name: '品牌官网改版',
      color: 'purple',
      members: [
        { id: 'm1', name: '林晓', role: '产品设计师', start: dateAt(3), end: dateAt(12) },
        { id: 'm2', name: '陈宇', role: '前端工程师', start: dateAt(8), end: dateAt(22) },
        { id: 'm3', name: '王可', role: '后端工程师', start: dateAt(12), end: dateAt(25) },
      ],
    },
    {
      id: 'p2',
      name: '移动端 2.0 迭代',
      color: 'blue',
      members: [
        { id: 'm4', name: '苏然', role: '产品经理', start: dateAt(2), end: dateAt(9) },
        { id: 'm5', name: '林晓', role: '产品设计师', start: dateAt(13), end: dateAt(22) },
        { id: 'm6', name: '周予', role: '开发工程师', start: dateAt(17), end: dateAt(29) },
      ],
    },
    {
      id: 'p3',
      name: '设计系统建设',
      color: 'green',
      members: [
        { id: 'm7', name: '许知', role: '设计负责人', start: dateAt(5), end: dateAt(19) },
        { id: 'm8', name: '陈宇', role: '前端工程师', start: dateAt(23), end: dateAt(30) },
      ],
    },
  ]

  return seed
}
