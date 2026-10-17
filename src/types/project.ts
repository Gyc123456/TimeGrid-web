export interface Attachment {
  id: string
  name: string
  size: number
  data: string
}
export interface Member {
  id: string
  name: string
  role: string
  start: string
  end: string
  notes?: string
  progress?: number
  attachments?: Attachment[]
}
export interface Project {
  id: string
  name: string
  color: string
  icon?: string
  iconKey?: string
  start?: string
  end?: string
  members: Member[]
}
