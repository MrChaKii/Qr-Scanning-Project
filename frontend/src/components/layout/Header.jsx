import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { User } from 'lucide-react'

export const Header = () => {
  const { user } = useAuth()

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white border-b border-slate-200 shadow-sm z-10 px-6 flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-800">
        Admin Portal
      </h2>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500 capitalize">
              {user?.role}
            </p>
          </div>

          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
            <User className="w-5 h-5 text-slate-600" />
          </div>
        </div>
      </div>
    </header>
  )
}
