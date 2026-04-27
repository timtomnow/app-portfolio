import { NavLink } from 'react-router-dom'

export default function Header() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-accent-600' : 'text-slate-500 hover:text-slate-800'
    }`

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <NavLink to="/" className="text-base font-bold text-slate-800 tracking-tight">
          timtomnow
        </NavLink>
        <nav className="flex gap-6">
          <NavLink to="/" end className={linkClass}>
            Portfolio
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
