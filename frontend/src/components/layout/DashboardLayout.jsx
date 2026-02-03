import React from 'react'
import { Header } from './Header'

export const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="pt-16 min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
