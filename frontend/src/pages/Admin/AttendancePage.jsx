import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { AttendanceScanner } from '../../components/features/AttendanceScanner'
import { Table } from '../../components/ui/Table'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { getDailySummary } from '../../services/attendance.service'

export const AttendancePage = () => {
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [summary, setSummary] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSummary = async () => {
    setIsLoading(true)
    try {
      const data = await getDailySummary(date)
      console.log('Daily summary data:', data)
      
      // Handle empty or invalid response
      if (!data || !Array.isArray(data)) {
        console.warn('Invalid data format received:', data)
        setSummary([])
        return
      }
      
      // Transform the API response to match the table structure
      const transformedData = data.map((item) => ({
        employeeId: item.employee?._id || 'N/A',
        name: item.employee?.name || 'Unknown',
        checkIn: item.firstIn?.scanTime,
        checkOut: item.lastOut?.scanTime,
        status: item.firstIn && item.lastOut ? 'Present' : item.firstIn ? 'Partial' : 'Absent',
        company: item.company?.companyName || 'N/A'
      }))
      setSummary(transformedData)
    } catch (error) {
      console.error('Failed to fetch attendance summary', error)
      setSummary([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [date])

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
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Attendance Management
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <AttendanceScanner onScanSuccess={fetchSummary} />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Daily Summary
              </h3>

              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-auto"
              />
            </div>

            <Table
              data={summary}
              columns={columns}
              keyExtractor={(item) => item.employeeId}
              isLoading={isLoading}
              emptyMessage="No attendance records for this date"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
