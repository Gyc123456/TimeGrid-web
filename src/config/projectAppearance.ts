import {
  Globe,
  Code2,
  Smartphone,
  Palette,
  Rocket,
  Briefcase,
  Folder,
  Database,
  ShieldCheck,
  ShoppingBag,
  Megaphone,
  Lightbulb,
  Target,
  BookOpen,
  Layers,
  Users,
} from 'lucide-vue-next'
export const projectIcons = [
  { key: 'layers', label: '通用', component: Layers },
  { key: 'folder', label: '文件夹', component: Folder },
  { key: 'globe', label: '网站', component: Globe },
  { key: 'code', label: '开发', component: Code2 },
  { key: 'phone', label: '移动端', component: Smartphone },
  { key: 'palette', label: '设计', component: Palette },
  { key: 'rocket', label: '上线', component: Rocket },
  { key: 'briefcase', label: '业务', component: Briefcase },
  { key: 'database', label: '数据', component: Database },
  { key: 'shield', label: '安全', component: ShieldCheck },
  { key: 'shop', label: '电商', component: ShoppingBag },
  { key: 'megaphone', label: '营销', component: Megaphone },
  { key: 'idea', label: '创意', component: Lightbulb },
  { key: 'target', label: '目标', component: Target },
  { key: 'book', label: '文档', component: BookOpen },
  { key: 'users', label: '团队', component: Users },
]
export function projectIcon(p: { iconKey?: string }) {
  return projectIcons.find((icon) => icon.key === p.iconKey)?.component || Layers
}
export const palette: Record<string, string> = {
  purple: '#8c76d6',
  blue: '#7098d7',
  green: '#77aa90',
  orange: '#d3a466',
}
export function projectColor(p: { color: string }) {
  return palette[p.color] || p.color || palette.purple!
}
export function projectStyle(p: { color: string }) {
  const color = projectColor(p)
  return { '--accent': color, '--soft': color + '18', '--bar': color + '30', '--ink': color }
}
