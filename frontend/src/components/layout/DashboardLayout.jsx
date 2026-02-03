import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../hooks/useAuth'

export const DashboardLayout = ({ children }) => {
  const { user } = useAuth()
  const showSidebar = user?.role !== 'process'

  return (
    <div className="min-h-screen bg-slate-50">
      {showSidebar && <Sidebar />}
      <Header withSidebar={showSidebar} />

      <main className={`pt-16 min-h-screen ${showSidebar ? 'ml-64' : ''}`}>
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
