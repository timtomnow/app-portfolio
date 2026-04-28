import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { loadApps } from '../data/loadApps'
import type { AppEntry } from '../types'
import AppForm from '../admin/AppForm'
import { deleteApp } from '../admin/saveApps'
import { assetUrl } from '../utils'

export default function Admin() {
  const [apps, setApps] = useState<AppEntry[]>(loadApps)
  const [editing, setEditing] = useState<AppEntry | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function handleSaved(app: AppEntry) {
    setApps(prev => {
      const idx = prev.findIndex(a => a.slug === app.slug)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = app
        return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      }
      return [app, ...prev]
    })
    setEditing(null)
  }

  async function handleDelete(slug: string) {
    try {
      await deleteApp(slug)
      setApps(prev => prev.filter(a => a.slug !== slug))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed.')
    } finally {
      setConfirmDelete(null)
    }
  }

  if (editing !== null) {
    return (
      <AppForm
        initial={editing === 'new' ? undefined : editing}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Admin</h1>
        <button
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-2 bg-accent-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors"
        >
          <Plus size={16} />
          New app
        </button>
      </div>

      {apps.length === 0 ? (
        <p className="text-slate-400">No apps yet — add one above.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map(app => (
            <div
              key={app.slug}
              className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-5 py-4"
            >
              <img
                src={assetUrl(app.iconPath)}
                alt=""
                className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{app.name}</p>
                <p className="text-xs text-slate-400 truncate">{app.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditing(app)}
                  className="p-2 text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                {confirmDelete === app.slug ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDelete(app.slug)}
                      className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(app.slug)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
