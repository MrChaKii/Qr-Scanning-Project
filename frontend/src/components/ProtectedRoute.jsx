import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from './ui/Spinner'

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  // Check if a specific role is required and if user has that role
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    )
  }

  return <>{children}</>
}
