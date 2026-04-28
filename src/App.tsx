import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Portfolio from './pages/Portfolio'
import About from './pages/About'
import AppDetail from './pages/AppDetail'
import { isAdmin } from './admin/useIsAdmin'

const AdminPage = isAdmin ? lazy(() => import('./pages/Admin')) : null

export default function App() {
  return (
    <HashRouter>
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-50 focus-visible:bg-white focus-visible:text-accent-700 focus-visible:font-medium focus-visible:px-4 focus-visible:py-2 focus-visible:rounded-lg focus-visible:shadow-md"
      >
        Skip to main content
      </a>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <main id="main-content" className="flex-1">
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
