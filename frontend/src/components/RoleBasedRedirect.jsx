import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const RoleBasedRedirect = () => {
  const { user } = useAuth()
  const role = (user?.role || '').toLowerCase()

  // Redirect based on user role
  if (role === 'security') {
    return <Navigate to="/security/scan" replace />
  }

  if (role === 'process') {
    return <Navigate to="/process/scan" replace />
  }

  // Default to admin dashboard
  return <Navigate to="/dashboard" replace />
}
