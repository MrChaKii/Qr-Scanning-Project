import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/UI/Badge'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/UI/Button'
import { getWorkSessions } from '../../services/workSession.service'

export const WorkSessionsPage = () => {
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')

  const fetchSessions = async (date) => {
    setIsLoading(true)
    try {
      const data = date ? await getWorkSessions({ date }) : await getWorkSessions()
      setSessions(data)
    } catch (error) {
      console.error('Failed to fetch work sessions', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions(selectedDate)
  }, [])

  useEffect(() => {
    fetchSessions(selectedDate)
  }, [selectedDate])

  const columns = [
    {
      header: 'Employee',
      accessor: (item) =>
        item.employeeId
          ? (item.employeeId.employeeId || item.employeeId.name || item.employeeId._id || 'Unknown')
          : 'Unknown',
    },
    {
      header: 'Company',
      accessor: (item) => item.companyId?.companyName || '—',
    },
    {
      header: 'Process',
      accessor: (item) => item.processName || '—',
    },
    {
      header: 'Start Time',
      accessor: (item) =>
        item.startTime ? new Date(item.startTime).toLocaleString() : '—',
    },
    {
      header: 'End Time',
      accessor: (item) =>
        item.endTime ? new Date(item.endTime).toLocaleString() : '—',
    },
    {
      header: 'Status',
      accessor: (item) => (
        <Badge
          variant={item.endTime ? 'neutral' : 'success'}
        >
          {(item.endTime ? 'COMPLETED' : 'ACTIVE')}
        </Badge>
      ),
    },
    {
      header: 'Duration (min)',
      accessor: (item) => (typeof item.durationMinutes === 'number' ? item.durationMinutes : '—'),
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Work Sessions
        </h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="w-full md:max-w-xs">
            <Input
              label="Filter by date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setSelectedDate('')}
              disabled={!selectedDate}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      <Table
        data={sessions}
        columns={columns}
        keyExtractor={(item) => item._id}
        isLoading={isLoading}
        emptyMessage={selectedDate ? `No work sessions found for ${selectedDate}` : 'No work sessions found'}
      />
    </DashboardLayout>
  )
}
