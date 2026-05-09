export type DeviceType = 'desktop' | 'mobile'

export type Screenshot = {
  path: string
  caption?: string
  device: DeviceType
}

export type DemoVideo = {
  path: string
  device: DeviceType
}

export type Section = {
  id: string
  label: string
  order: number
}

export type AppEntry = {
  slug: string
  name: string
  description: string
  complexity: 1 | 2 | 3 | 4 | 5
  liveUrl?: string
  repoUrl?: string
  iconPath: string
  screenshots: Screenshot[]
  demoVideo?: DemoVideo
  sectionId?: string
  createdAt: string
  updatedAt: string
}
