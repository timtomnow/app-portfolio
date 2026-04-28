import { useState, useEffect, useRef } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Github, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { loadApps } from '../data/loadApps'
import ComplexityDots from '../components/ComplexityDots'
import { assetUrl } from '../utils'

const apps = loadApps()

export default function AppDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([])
  const lastIndexRef = useRef<number | null>(null)

  const app = apps.find(a => a.slug === slug)
  const shotCount = app?.screenshots.length ?? 0

  useEffect(() => {
    if (lightboxIndex !== null) {
      lastIndexRef.current = lightboxIndex
      closeBtnRef.current?.focus()
    } else if (lastIndexRef.current !== null) {
      triggerRefs.current[lastIndexRef.current]?.focus()
    }
  }, [lightboxIndex])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowRight')
        setLightboxIndex(i => (i !== null && i < shotCount - 1 ? i + 1 : i))
      if (e.key === 'ArrowLeft')
        setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, shotCount])

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
          width={80}
          height={80}
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
        <section aria-label="Screenshots" className="mb-12">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Screenshots
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {app.screenshots.map((shot, i) => (
              <button
                key={i}
                ref={(el: HTMLButtonElement | null) => { triggerRefs.current[i] = el }}
                onClick={() => setLightboxIndex(i)}
                aria-label={`View screenshot ${i + 1}${shot.caption ? `: ${shot.caption}` : ''} full size`}
                className="group rounded-xl overflow-hidden border border-slate-200 hover:border-accent-400 transition-colors text-left w-full"
              >
                <img
                  src={assetUrl(shot.path)}
                  alt={shot.caption ?? `Screenshot ${i + 1} of ${app.screenshots.length}`}
                  loading="lazy"
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
        <section aria-label="Demo video" className="mb-12">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Demo
          </h2>
          <video
            src={assetUrl(app.demoVideo.path)}
            controls
            aria-label={`${app.name} demo video`}
            className="w-full max-h-[520px] rounded-xl border border-slate-200 bg-slate-900"
          />
        </section>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Screenshot ${lightboxIndex + 1} of ${app.screenshots.length}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            ref={closeBtnRef}
            onClick={() => setLightboxIndex(null)}
            aria-label="Close lightbox"
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-1.5 rounded"
          >
            <X size={22} />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i !== null && i > 0 ? i - 1 : i)) }}
              aria-label="Previous screenshot"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2 rounded"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <img
            src={assetUrl(app.screenshots[lightboxIndex].path)}
            alt={app.screenshots[lightboxIndex].caption ?? `Screenshot ${lightboxIndex + 1} of ${app.screenshots.length}`}
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />

          {lightboxIndex < app.screenshots.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIndex(i => (i !== null && i < shotCount - 1 ? i + 1 : i)) }}
              aria-label="Next screenshot"
              className="absolute right-16 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors p-2 rounded"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
