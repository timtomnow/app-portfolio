import rawData from './apps.json'
import type { AppEntry, Section } from '../types'

const data = rawData as { apps: AppEntry[]; sections: Section[] }

export function loadApps(): AppEntry[] {
  return [...data.apps].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function loadSections(): Section[] {
  return [...(data.sections ?? [])].sort((a, b) => a.order - b.order)
}
