import React from 'react'
import { AttendanceScanner } from '../../components/features/AttendanceScanner'
import { useAuth } from '../../hooks/useAuth'
import { LogOut } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export const AttendanceScanPage = () => {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Security Portal</h1>
            <p className="text-sm text-slate-600 mt-1">
              Welcome, {user?.username}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={logout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Attendance Scanner
          </h2>
          <p className="text-slate-600">
            Scan employee QR codes to record attendance
          </p>
        </div>

        <AttendanceScanner />
      </div>
    </div>
  )
}
