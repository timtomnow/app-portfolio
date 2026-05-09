import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import { loadApps, loadSections } from '../data/loadApps'
import type { AppEntry, Section } from '../types'
import AppForm from '../admin/AppForm'
import { deleteApp, saveSections } from '../admin/saveApps'
import { assetUrl } from '../utils'

function genId(label: string): string {
  return (
    label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  )
}

export default function Admin() {
  const [apps, setApps] = useState<AppEntry[]>(loadApps)
  const [sections, setSections] = useState<Section[]>(loadSections)
  const [editing, setEditing] = useState<AppEntry | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [confirmDeleteSection, setConfirmDeleteSection] = useState<string | null>(null)
  const [addingSection, setAddingSection] = useState(false)
  const [newSectionLabel, setNewSectionLabel] = useState('')

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

  async function persistSections(next: Section[], deletedId?: string) {
    try {
      await saveSections(next, deletedId)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to save sections.')
    }
  }

  function handleAddSection() {
    if (!newSectionLabel.trim()) return
    const next: Section[] = [
      ...sections,
      { id: genId(newSectionLabel), label: newSectionLabel.trim(), order: sections.length },
    ]
    setSections(next)
    setNewSectionLabel('')
    setAddingSection(false)
    persistSections(next)
  }

  function moveSection(id: string, dir: 'up' | 'down') {
    const idx = sections.findIndex(s => s.id === id)
    const newIdx = dir === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= sections.length) return
    const arr = [...sections]
    ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
    const next = arr.map((s, i) => ({ ...s, order: i }))
    setSections(next)
    persistSections(next)
  }

  function startRename(id: string, label: string) {
    setEditingSectionId(id)
    setEditLabel(label)
    setConfirmDeleteSection(null)
  }

  async function commitRename(id: string) {
    if (!editLabel.trim()) { setEditingSectionId(null); return }
    const next = sections.map(s => (s.id === id ? { ...s, label: editLabel.trim() } : s))
    setSections(next)
    setEditingSectionId(null)
    await persistSections(next)
  }

  async function handleDeleteSection(id: string) {
    const next = sections
      .filter(s => s.id !== id)
      .map((s, i) => ({ ...s, order: i }))
    setSections(next)
    setApps(prev => prev.map(a => (a.sectionId === id ? { ...a, sectionId: undefined } : a)))
    setConfirmDeleteSection(null)
    await persistSections(next, id)
  }

  if (editing !== null) {
    return (
      <AppForm
        initial={editing === 'new' ? undefined : editing}
        sections={sections}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />
    )
  }

  const sectionLabel = (id?: string) => sections.find(s => s.id === id)?.label

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

      {/* ── Sections ── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Sections</h2>
          {!addingSection && (
            <button
              onClick={() => setAddingSection(true)}
              className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 transition-colors"
            >
              <Plus size={13} />
              Add section
            </button>
          )}
        </div>

        {addingSection && (
          <div className="flex items-center gap-2 mb-2">
            <input
              autoFocus
              type="text"
              value={newSectionLabel}
              onChange={e => setNewSectionLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSection()
                if (e.key === 'Escape') { setAddingSection(false); setNewSectionLabel('') }
              }}
              placeholder="Section name"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
            <button
              onClick={handleAddSection}
              className="p-2 text-accent-600 hover:text-accent-700 transition-colors"
              title="Add"
            >
              <Check size={15} />
            </button>
            <button
              onClick={() => { setAddingSection(false); setNewSectionLabel('') }}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              title="Cancel"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {sections.length === 0 && !addingSection ? (
          <p className="text-sm text-slate-400">No sections — apps appear under General.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sections.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3"
              >
                <div className="flex flex-col shrink-0">
                  <button
                    onClick={() => moveSection(s.id, 'up')}
                    disabled={i === 0}
                    className="text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveSection(s.id, 'down')}
                    disabled={i === sections.length - 1}
                    className="text-slate-300 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {editingSectionId === s.id ? (
                  <input
                    autoFocus
                    type="text"
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename(s.id)
                      if (e.key === 'Escape') setEditingSectionId(null)
                    }}
                    className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-slate-700">{s.label}</span>
                )}

                <div className="flex items-center gap-1 shrink-0">
                  {editingSectionId === s.id ? (
                    <>
                      <button
                        onClick={() => commitRename(s.id)}
                        className="p-1.5 text-accent-600 hover:text-accent-700 transition-colors"
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => setEditingSectionId(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : confirmDeleteSection === s.id ? (
                    <>
                      <button
                        onClick={() => handleDeleteSection(s.id)}
                        className="px-2.5 py-1 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteSection(null)}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startRename(s.id, s.label)}
                        className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                        title="Rename"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteSection(s.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Apps ── */}
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Apps</h2>
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
                <p className="text-xs text-slate-400 truncate">
                  {app.slug}
                  {app.sectionId && sectionLabel(app.sectionId) && (
                    <span className="ml-2 text-accent-500">· {sectionLabel(app.sectionId)}</span>
                  )}
                </p>
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
