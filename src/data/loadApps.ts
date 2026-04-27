import rawData from './apps.json'
import type { AppEntry } from '../types'

const data = rawData as { apps: AppEntry[] }

export function loadApps(): AppEntry[] {
  return [...data.apps].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}
