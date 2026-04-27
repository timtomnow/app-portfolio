import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isAdmin } from './useIsAdmin'

type Props = { children: ReactNode }

export default function AdminRoute({ children }: Props) {
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
