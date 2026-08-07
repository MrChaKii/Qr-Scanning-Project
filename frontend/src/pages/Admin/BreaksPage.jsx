import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Table } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { BreakForm } from '../../components/forms/BreakForm'
import {
  getBreakSessions,
  createBreakSession,
  updateBreakSession,
  deleteBreakSession,
  migrateBreakSessions,
} from '../../services/break.service'
import { Plus, RefreshCw } from 'lucide-react'
import { useToast } from '../../hooks/useToast'

/**
 * Convert "HH:MM" to total minutes since midnight.
 */
const toMinutes = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string') return 0
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Human-readable duration from two "HH:MM" strings.
 */
const formatTimeDiff = (start, end) => {
  const diff = toMinutes(end) - toMinutes(start)
  if (diff <= 0) return '—'
  const h = Math.floor(diff / 60)
  const m = diff % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m} min`
}

/**
 * Display an "HH:MM" time in 12-hour format with AM/PM for readability.
 */
const formatTime12h = (hhmm) => {
  if (!hhmm || typeof hhmm !== 'string' || !/^\d{2}:\d{2}$/.test(hhmm)) return hhmm || '—'
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export const BreaksPage = () => {
  const [breaks, setBreaks] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBreak, setEditingBreak] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [isMigrating, setIsMigrating] = useState(false)
  const { showToast } = useToast()

  const loadBreaks = async () => {
    setIsLoading(true)
    try {
      const data = await getBreakSessions()
      setBreaks(data)
    } catch (error) {
      console.error('Failed to load breaks', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBreaks()
  }, [])

  const handleSuccess = async (formData) => {
    setIsModalOpen(false)
    try {
      if (editingBreak) {
        await updateBreakSession(editingBreak._id, formData)
        showToast('Break updated successfully', 'success')
      } else {
        await createBreakSession(formData)
        showToast('Break created successfully', 'success')
      }
      await loadBreaks()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to save break', 'error')
    }
    setEditingBreak(null)
  }

  const handleEdit = (breakSession) => {
    setEditingBreak(breakSession)
    setIsModalOpen(true)
  }

  const handleDelete = (id) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    await deleteBreakSession(deleteId)
    showToast('Break deleted successfully', 'success')
    await loadBreaks()
    setDeleteId(null)
  }

  const cancelDelete = () => {
    setDeleteId(null)
  }

  const handleMigrate = async () => {
    setIsMigrating(true)
    try {
      const result = await migrateBreakSessions()
      const { migrated, skipped, needsManualFix, errors } = result
      const parts = [`Migrated: ${migrated}`, `Already OK: ${skipped}`]
      if (needsManualFix?.length) parts.push(`Needs manual fix: ${needsManualFix.length}`)
      if (errors?.length) parts.push(`Errors: ${errors.length}`)
      showToast(parts.join(' · '), migrated > 0 ? 'success' : 'info')
      await loadBreaks()
    } catch (err) {
      showToast(err?.response?.data?.message || 'Migration failed', 'error')
    } finally {
      setIsMigrating(false)
    }
  }

  const columns = [
    {
      header: 'Break Type',
      accessor: (item) => item.breakType,
    },
    {
      header: 'Start Time',
      accessor: (item) => formatTime12h(item.startTime),
    },
    {
      header: 'End Time',
      accessor: (item) => formatTime12h(item.endTime),
    },
    {
      header: 'Duration',
      accessor: (item) => {
        // Prefer pre-computed durationMinutes when HH:MM times are not available
        if (item.startTime && item.endTime && /^\d{2}:\d{2}$/.test(item.startTime)) {
          return formatTimeDiff(item.startTime, item.endTime)
        }
        if (item.durationMinutes !== undefined && item.durationMinutes !== null) {
          const n = Number(item.durationMinutes)
          if (!Number.isNaN(n) && n >= 0) return `${n} min`
        }
        return '—'
      },
    },
    {
      header: 'Actions',
      accessor: (item) => (
        <div className="flex space-x-2">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>Edit</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(item._id)}>Delete</Button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Break Management</h1>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleMigrate}
            disabled={isMigrating}
            title="Convert old duration-based breaks to time-range format"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isMigrating ? 'animate-spin' : ''}`} />
            {isMigrating ? 'Migrating…' : 'Migrate Old Data'}
          </Button>

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Break
          </Button>
        </div>
      </div>

      <Table
        data={breaks}
        columns={columns}
        keyExtractor={(item) => item._id}
        isLoading={isLoading}
        emptyMessage="No break sessions recorded"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBreak(null) }}
        title={editingBreak ? 'Edit Break Session' : 'Add Break Session'}
      >
        <BreakForm
          initialData={editingBreak}
          onSuccess={handleSuccess}
          onCancel={() => { setIsModalOpen(false); setEditingBreak(null) }}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!deleteId}
        onClose={cancelDelete}
        title="Confirm Delete"
      >
        <div className="p-4 text-center">
          <p className="mb-6 text-lg text-slate-700">Are you sure you want to delete this break session?</p>
          <div className="flex justify-center space-x-4">
            <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}