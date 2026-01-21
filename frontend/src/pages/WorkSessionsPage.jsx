import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Table } from '../components/ui/Table'
import { Button } from '../components/UI/Button'
import { Badge } from '../components/UI/Badge'
import { Modal } from '../components/ui/Modal'
import { WorkSessionForm } from '../components/forms/WorkSessionForm'
import { SessionTimer } from '../components/features/SessionTimer'
import {
  getWorkSessions,
  stopWorkSession,
} from '../services/workSession.service'
import { Plus, Play, Square } from 'lucide-react'
import { useToast } from '../hooks/useToast'

export const WorkSessionsPage = () => {
  const [sessions, setSessions] = useState([])
  const [filter, setFilter] = useState('active')
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { showToast } = useToast()

  const fetchSessions = async () => {
    setIsLoading(true)
    try {
      const data = await getWorkSessions(filter)
      setSessions(data)
    } catch (error) {
      console.error('Failed to fetch work sessions', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [filter])

  const handleStopSession = async (id) => {
    if (window.confirm('Are you sure you want to stop this session?')) {
      try {
        await stopWorkSession(id)
        showToast('Session stopped successfully', 'success')
        fetchSessions()
      } catch (error) {
        showToast('Failed to stop session', 'error')
      }
    }
  }

  const handleSuccess = () => {
    setIsModalOpen(false)
    fetchSessions()
  }

  const columns = [
    {
      header: 'Employee',
      accessor: (item) =>
        item.employee
          ? `${item.employee.firstName} ${item.employee.lastName}`
          : 'Unknown',
    },
    {
      header: 'Machine',
      accessor: 'machineId',
    },
    {
      header: 'Start Time',
      accessor: (item) =>
        new Date(item.startTime).toLocaleTimeString(),
    },
    {
      header: 'Duration',
      accessor: (item) =>
        item.status === 'active' ? (
          <SessionTimer startTime={item.startTime} />
        ) : item.duration ? (
          `${Math.floor(item.duration / 3600)}h ${Math.floor(
            (item.duration % 3600) / 60
          )}m`
        ) : (
          '-'
        ),
    },
    {
      header: 'Status',
      accessor: (item) => (
        <Badge
          variant={item.status === 'active' ? 'success' : 'neutral'}
        >
          {item.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (item) =>
        item.status === 'active' && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleStopSession(item.id)}
          >
            <Square className="w-3 h-3 mr-1" />
            Stop
          </Button>
        ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Work Sessions
        </h1>

        <Button onClick={() => setIsModalOpen(true)}>
          <Play className="w-4 h-4 mr-2" />
          Start Session
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Active Sessions
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completed History
          </button>
        </div>
      </div>

      <Table
        data={sessions}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage={`No ${filter} sessions found`}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Start New Work Session"
      >
        <WorkSessionForm
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </DashboardLayout>
  )
}
