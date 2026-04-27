import { loadApps } from '../data/loadApps'
import AppCard from '../components/AppCard'

const apps = loadApps()

export default function Portfolio() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-800 mb-8">Projects</h1>
      {apps.length === 0 ? (
        <p className="text-slate-400">No projects yet — check back soon.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {apps.map(app => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      )}
    </div>
  )
}
