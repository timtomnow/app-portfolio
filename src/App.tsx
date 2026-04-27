import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Portfolio from './pages/Portfolio'
import About from './pages/About'
import AppDetail from './pages/AppDetail'

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
