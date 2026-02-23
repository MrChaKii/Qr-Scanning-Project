import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Table } from '../../components/ui/Table'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../hooks/useToast'
import { getDailySummary, updateAttendanceLogScanTime } from '../../services/attendance.service'

const toTimeValue = (scanTime) => {
  if (!scanTime) return ''
  const d = new Date(scanTime)
  if (Number.isNaN(d.getTime())) return ''
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

const toIsoFromDateAndTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null
  const [yyyy, mm, dd] = dateStr.split('-').map((v) => Number(v))
  const [hh, min] = timeStr.split(':').map((v) => Number(v))
  if (!yyyy || !mm || !dd) return null
  if (Number.isNaN(hh) || Number.isNaN(min)) return null
  const local = new Date(yyyy, mm - 1, dd, hh, min, 0, 0)
  if (Number.isNaN(local.getTime())) return null
  return local.toISOString()
}

export const AttendancePage = () => {
  const { showToast } = useToast()
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [summary, setSummary] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [editCheckIn, setEditCheckIn] = useState('')
  const [editCheckOut, setEditCheckOut] = useState('')

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
        id:
          item.employee?._id ||
          item.employee?.employeeId ||
          item.firstIn?._id ||
          item.lastOut?._id ||
          `${item.employee?.name || 'employee'}-${date}`,
        employeeId: item.employee?.employeeId || 'N/A',
        name: item.employee?.name || 'Unknown',
        checkIn: item.firstIn?.scanTime,
        checkOut: item.lastOut?.scanTime,
        checkInLogId: item.firstIn?._id,
        checkOutLogId: item.lastOut?._id,
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

  const openEdit = (row) => {
    setEditRow(row)
    setEditCheckIn(toTimeValue(row?.checkIn))
    setEditCheckOut(toTimeValue(row?.checkOut))
    setIsEditOpen(true)
  }

  const closeEdit = () => {
    if (isSaving) return
    setIsEditOpen(false)
    setEditRow(null)
    setEditCheckIn('')
    setEditCheckOut('')
  }

  const saveEdits = async () => {
    if (!editRow) return
    setIsSaving(true)
    try {
      const updates = []

      if (editRow.checkInLogId) {
        const original = toTimeValue(editRow.checkIn)
        const iso = editCheckIn && editCheckIn !== original ? toIsoFromDateAndTime(date, editCheckIn) : null
        if (iso) {
          updates.push(updateAttendanceLogScanTime(editRow.checkInLogId, iso))
        }
      }

      if (editRow.checkOutLogId) {
        const original = toTimeValue(editRow.checkOut)
        const iso = editCheckOut && editCheckOut !== original ? toIsoFromDateAndTime(date, editCheckOut) : null
        if (iso) {
          updates.push(updateAttendanceLogScanTime(editRow.checkOutLogId, iso))
        }
      }

      if (updates.length === 0) {
        showToast('Nothing to update', 'warning')
        return
      }

      await Promise.all(updates)
      showToast('Attendance times updated', 'success')
      closeEdit()
      await fetchSummary()
    } catch (error) {
      console.error('Failed to update attendance times', error)
      const msg = error?.response?.data?.message || error?.message || 'Failed to update attendance times'
      showToast(msg, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const columns = [
    {
      header: 'Employee ID',
      accessor: 'employeeId',
    },
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
    {
      header: 'Actions',
      accessor: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => openEdit(item)}
          disabled={!item.checkInLogId && !item.checkOutLogId}
        >
          Edit Times
        </Button>
      ),
      className: 'whitespace-nowrap',
    },
  ]

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Attendance Management
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* <div className="lg:col-span-1">
          <AttendanceScanner onScanSuccess={fetchSummary} />
        </div> */}

        <div className="lg:col-span-10">
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
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
              emptyMessage="No attendance records for this date"
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isEditOpen}
        onClose={closeEdit}
        title={editRow ? `Edit Times - ${editRow.name}` : 'Edit Times'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Check In Time"
              type="time"
              value={editCheckIn}
              onChange={(e) => setEditCheckIn(e.target.value)}
              disabled={!editRow?.checkInLogId}
            />

            <Input
              label="Check Out Time"
              type="time"
              value={editCheckOut}
              onChange={(e) => setEditCheckOut(e.target.value)}
              disabled={!editRow?.checkOutLogId}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeEdit} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={saveEdits} isLoading={isSaving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
