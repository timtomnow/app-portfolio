import { loadApps, loadSections } from '../data/loadApps'
import type { AppEntry } from '../types'
import AppCard from '../components/AppCard'

const apps = loadApps()
const sections = loadSections()

type Group = { id: string; label: string; apps: AppEntry[] }

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

export default function Portfolio() {
  if (apps.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-800 mb-8">Projects</h1>
        <p className="text-slate-400">No projects yet — check back soon.</p>
      </div>
    )
  }

  const groups: Group[] = [
    ...sections.map(s => ({
      id: s.id,
      label: s.label,
      apps: apps.filter(a => a.sectionId === s.id),
    })),
    {
      id: 'general',
      label: 'General',
      apps: apps.filter(a => !a.sectionId || !sections.find(s => s.id === a.sectionId)),
    },
  ].filter(g => g.apps.length > 0)

  const hasNamedSections = groups.some(g => g.id !== 'general')

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 id="top" className="text-2xl font-bold text-slate-800 mb-8">Projects</h1>

      {hasNamedSections && groups.length > 1 && (
        <nav aria-label="Jump to section" className="flex flex-wrap gap-2 mb-10">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => scrollTo(`section-${g.id}`)}
              className="text-sm text-accent-600 hover:text-accent-700 border border-accent-200 hover:border-accent-400 rounded-full px-3 py-1 transition-colors"
            >
              {g.label}
            </button>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-14">
        {groups.map(g => (
          <section key={g.id} id={`section-${g.id}`} aria-label={g.label}>
            {hasNamedSections && (
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-slate-700">{g.label}</h2>
                <button
                  onClick={() => scrollTo('top')}
                  className="text-xs text-slate-400 hover:text-accent-600 transition-colors"
                >
                  ↑ Top
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {g.apps.map(app => (
                <AppCard key={app.slug} app={app} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
