import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Github } from 'lucide-react'
import { loadApps } from '../data/loadApps'
import ComplexityDots from '../components/ComplexityDots'
import { assetUrl } from '../utils'

const apps = loadApps()

export default function AppDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [lightbox, setLightbox] = useState<string | null>(null)

  const app = apps.find(a => a.slug === slug)
  if (!app) return <Navigate to="/" replace />

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-accent-600 transition-colors mb-10"
      >
        <ArrowLeft size={15} />
        All projects
      </Link>

      {/* App header */}
      <div className="flex items-start gap-6 mb-8">
        <img
          src={assetUrl(app.iconPath)}
          alt={`${app.name} icon`}
          className="w-20 h-20 rounded-2xl object-cover shrink-0 bg-slate-100 shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-800">{app.name}</h1>
          <div className="mt-2">
            <ComplexityDots value={app.complexity} label />
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            {app.liveUrl && (
              <a
                href={app.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors"
              >
                <ExternalLink size={14} />
                Live site
              </a>
            )}
            {app.repoUrl && (
              <a
                href={app.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Github size={14} />
                GitHub
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-600 leading-relaxed text-[15px] mb-12">{app.description}</p>

      {/* Screenshots */}
      {app.screenshots.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Screenshots
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {app.screenshots.map((shot, i) => (
              <button
                key={i}
                onClick={() => setLightbox(assetUrl(shot.path))}
                className="group rounded-xl overflow-hidden border border-slate-200 hover:border-accent-400 transition-colors text-left w-full"
              >
                <img
                  src={assetUrl(shot.path)}
                  alt={shot.caption ?? `Screenshot ${i + 1}`}
                  className="w-full object-cover group-hover:opacity-90 transition-opacity"
                />
                {shot.caption && (
                  <p className="text-xs text-slate-500 px-3 py-2">{shot.caption}</p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Demo video */}
      {app.demoVideo && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Demo
          </h2>
          <video
            src={assetUrl(app.demoVideo.path)}
            controls
            className="w-full rounded-xl border border-slate-200"
          />
        </section>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Screenshot enlarged"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
