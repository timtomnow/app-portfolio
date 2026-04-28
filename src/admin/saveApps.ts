import type { AppEntry } from '../types'

type IconUpload = { data: string; ext: 'png' | 'svg' }
type ScreenshotUpload = { data: string; name: string }
type VideoUpload = { data: string }

export type SavePayload = {
  app: AppEntry
  files: {
    icon?: IconUpload
    screenshots: ScreenshotUpload[]
    demoVideo?: VideoUpload
  }
}

export async function saveApp(payload: SavePayload): Promise<void> {
  const res = await fetch('/api/admin/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Save failed: ${text}`)
  }
}

export async function deleteApp(slug: string): Promise<void> {
  const res = await fetch('/api/admin/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  })
  if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`)
}
