import { Link } from 'react-router-dom'
import { ExternalLink, Github } from 'lucide-react'
import type { AppEntry } from '../types'
import ComplexityDots from './ComplexityDots'
import { assetUrl } from '../utils'

type Props = { app: AppEntry }

export default function AppCard({ app }: Props) {
  return (
    <Link
      to={`/app/${app.slug}`}
      className="group flex flex-col bg-white rounded-xl border border-slate-200 p-5 gap-4 hover:shadow-md hover:border-slate-300 transition-all"
    >
      <div className="flex items-start gap-4">
        <img
          src={assetUrl(app.iconPath)}
          alt={`${app.name} icon`}
          width={56}
          height={56}
          loading="lazy"
          className="w-14 h-14 rounded-xl object-cover shrink-0 bg-slate-100"
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-800 group-hover:text-accent-600 transition-colors leading-snug">
            {app.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {app.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-1">
        <ComplexityDots value={app.complexity} />
        <div className="flex gap-3">
          {app.liveUrl && (
            <a
              href={app.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-slate-400 hover:text-accent-600 transition-colors"
              aria-label={`${app.name} live site`}
            >
              <ExternalLink size={15} />
            </a>
          )}
          {app.repoUrl && (
            <a
              href={app.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-slate-400 hover:text-accent-600 transition-colors"
              aria-label={`${app.name} GitHub repo`}
            >
              <Github size={15} />
            </a>
          )}
        </div>
      </div>
    </Link>
  )
}
