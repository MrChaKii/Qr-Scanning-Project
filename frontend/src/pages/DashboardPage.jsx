import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
// import { StatsCard } from '../components/features/StatsCard'
import { Table } from '../components/ui/Table'
import { Button } from '../components/UI/Button'
import { Badge } from '../components/UI/Badge'
import {
  Users,
  Clock,
  Building2,
  CheckCircle,
  Plus,
  QrCode,
} from 'lucide-react'
// import { getAnalyticsDashboard } from '../services/analytics.service'
// import { getDailySummary } from '../services/attendance.service'
import { useNavigate } from 'react-router-dom'

export const DashboardPage = () => {
  const [stats, setStats] = useState(null)
  const [recentAttendance, setRecentAttendance] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const navigate = useNavigate()

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [statsData, attendanceData] = await Promise.all([
//           getAnalyticsDashboard(),
//           getDailySummary(new Date().toISOString().split('T')[0]),
//         ])

//         setStats(statsData)
//         setRecentAttendance(attendanceData.slice(0, 5))
//       } catch (error) {
//         console.error('Failed to fetch dashboard data', error)
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchData()
//   }, [])

  const columns = [
    {
      header: 'Employee',
      accessor: 'name',
    },
    {
      header: 'Check In',
      accessor: (item) =>
        item.checkIn
          ? new Date(item.checkIn).toLocaleTimeString()
          : '-',
    },
    {
      header: 'Check Out',
      accessor: (item) =>
        item.checkOut
          ? new Date(item.checkOut).toLocaleTimeString()
          : '-',
    },
    {
      header: 'Status',
      accessor: (item) => (
        <Badge
          variant={
            item.status === 'Present'
              ? 'success'
              : item.status === 'Partial'
              ? 'warning'
              : 'error'
          }
        >
          {item.status}
        </Badge>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-600">
            Overview of your workforce today
          </p>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/attendance')}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Scan Attendance
          </Button>

          <Button onClick={() => navigate('/employees')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-slate-200 rounded-lg"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Today's Attendance"
            value={stats?.todayAttendance || 0}
            icon={CheckCircle}
            color="green"
            trend="+5%"
            trendUp={true}
          />
          <StatsCard
            title="Active Sessions"
            value={stats?.activeWorkSessions || 0}
            icon={Clock}
            color="blue"
          />
          <StatsCard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            icon={Users}
            color="purple"
          />
          <StatsCard
            title="Manpower Ratio"
            value={
              stats
                ? `${Math.round(
                    (stats.manpowerCount /
                      stats.totalEmployees) *
                      100
                  )}%`
                : '0%'
            }
            icon={Building2}
            color="amber"
          />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Recent Attendance
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/attendance')}
          >
            View All
          </Button>
        </div>

        <Table
          data={recentAttendance}
          columns={columns}
          keyExtractor={(item) => item.employeeId}
          isLoading={isLoading}
          emptyMessage="No attendance records for today"
        />
      </div>
    </DashboardLayout>
  )
}
