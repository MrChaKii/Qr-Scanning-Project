import React, { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/layout/DashboardLayout'
import { Table } from '../../components/ui/Table'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../hooks/useToast'
import { getOTSummary } from '../../services/attendance.service'
import { getShiftTimes, upsertShiftTimes } from '../../services/shiftTime.service'

export const OTHoursPage = () => {
  const { showToast } = useToast()
  const [date, setDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [summary, setSummary] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [shiftTimes, setShiftTimes] = useState(null)
  const [isShiftLoading, setIsShiftLoading] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [otThreshold, setOtThreshold] = useState(8)

  const fetchShiftData = async () => {
    setIsShiftLoading(true)
    try {
      const data = await getShiftTimes()
      if (data) {
        setShiftTimes(data)
        setOtThreshold(data.otThresholdHours ?? 8)
      }
    } catch (error) {
      console.error('Failed to fetch shift times', error)
    } finally {
      setIsShiftLoading(false)
    }
  }

  const fetchSummary = async () => {
    setIsLoading(true)
    try {
      const data = await getOTSummary(date)
      if (!data || !Array.isArray(data)) {
        setSummary([])
        return
      }
      
      setSummary(data)
    } catch (error) {
      console.error('Failed to fetch OT summary', error)
      showToast('Failed to fetch OT summary', 'error')
      setSummary([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShiftData()
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [date])

  const openEditModal = () => {
    setOtThreshold(shiftTimes?.otThresholdHours ?? 8)
    setIsEditModalOpen(true)
  }

  const handleSaveThreshold = async () => {
    setIsSaving(true)
    try {
      // Keep existing shift times, just update the OT threshold
      const payload = {
        dayStart: shiftTimes?.dayStart || '08:00',
        dayEnd: shiftTimes?.dayEnd || '17:00',
        nightStart: shiftTimes?.nightStart || '20:00',
        nightEnd: shiftTimes?.nightEnd || '05:00',
        otThresholdHours: Number(otThreshold)
      }
      const updated = await upsertShiftTimes(payload)
      setShiftTimes(updated)
      setOtThreshold(updated.otThresholdHours)
      showToast('OT Threshold updated successfully', 'success')
      setIsEditModalOpen(false)
      // Refresh summary to recalculate OT hours
      fetchSummary()
    } catch (error) {
      console.error('Failed to save OT threshold', error)
      showToast('Failed to save OT threshold', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const columns = [
    {
      header: 'Employee ID',
      accessor: (item) => item.employee?.employeeId || 'N/A',
    },
    {
      header: 'Employee',
      accessor: (item) => item.employee?.name || 'Unknown',
    },
    {
      header: 'Company',
      accessor: (item) => item.company?.companyName || 'N/A',
    },
    {
      header: 'Shift',
      accessor: (item) => (
        <Badge
          variant={
            item.shift === 'DAY'
              ? 'success'
              : item.shift === 'NIGHT'
              ? 'warning'
              : 'outline'
          }
        >
          {item.shift || '—'}
        </Badge>
      ),
    },
    {
      header: 'Check In',
      accessor: (item) =>
        item.firstIn?.scanTime
          ? new Date(item.firstIn.scanTime).toLocaleTimeString()
          : '-',
    },
    {
      header: 'Check Out',
      accessor: (item) =>
        item.lastOut?.scanTime
          ? new Date(item.lastOut.scanTime).toLocaleTimeString()
          : '-',
    },
    {
      header: 'Total Hours',
      accessor: (item) => (
         <span className="font-semibold text-slate-700">
           {item.totalHours ? `${item.totalHours} hrs` : '-'}
         </span>
      ),
    },
    {
      header: 'OT Hours',
      accessor: (item) => {
        const otHours = parseFloat(item.otHours || 0);
        return (
          <Badge
            variant={otHours > 0 ? 'warning' : 'outline'}
          >
            {otHours > 0 ? `${otHours} hrs` : '0 hrs'}
          </Badge>
        )
      },
    },
  ]

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            OT Hours Report
          </h1>
          <p className="text-slate-600">
            View employee overtime hours by shift and day
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white px-3 py-2 border border-slate-200 rounded-md shadow-sm text-sm font-medium text-slate-700">
             OT Threshold: <span className="text-blue-600">{isShiftLoading ? '...' : (shiftTimes?.otThresholdHours ?? 8)} hrs</span>
          </div>
          <Button variant="outline" onClick={openEditModal}>
            Edit Threshold
          </Button>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <Table
          data={summary}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="No attendance records for this date to calculate OT"
        />
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit OT Threshold"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Define the standard working hours before overtime is calculated. This applies to all employees and shifts.
          </p>
          <Input
            label="OT Threshold (Hours)"
            type="number"
            step="0.5"
            min="0"
            value={otThreshold}
            onChange={(e) => setOtThreshold(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveThreshold} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
