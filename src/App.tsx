import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Portfolio from './pages/Portfolio'
import About from './pages/About'
import AppDetail from './pages/AppDetail'
import { isAdmin } from './admin/useIsAdmin'

// When isAdmin is false (every production build), this ternary evaluates to null
// at build time and Rollup eliminates the dynamic import entirely from the bundle.
const AdminPage = isAdmin ? lazy(() => import('./pages/Admin')) : null

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Portfolio />} />
            <Route path="/about" element={<About />} />
            <Route path="/app/:slug" element={<AppDetail />} />
            {AdminPage && (
              <Route
                path="/admin"
                element={
                  <Suspense fallback={null}>
                    <AdminPage />
                  </Suspense>
                }
              />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
