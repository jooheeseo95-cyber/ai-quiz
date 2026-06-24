import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useStore } from '../store/useStore'

export default function AdminRoute({ children }: { children: ReactNode }) {
  const isAdmin = useStore((s) => s.isAdmin)
  return isAdmin ? <>{children}</> : <Navigate to="/admin/login" replace />
}
