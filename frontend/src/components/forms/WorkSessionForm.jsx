import React, { useEffect, useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { useToast } from '../../hooks/useToast'
import { startWorkSession } from '../../services/workSession.service'
import { getEmployees } from '../../services/employee.service'
import { useAuth } from '../../hooks/useAuth'

export const WorkSessionForm = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    employeeId: '',
    machineId: '',
  })

  const [employees, setEmployees] = useState([])
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const { showToast } = useToast()

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await getEmployees()
        setEmployees(data)
      } catch (error) {
        showToast('Failed to load employees', 'error')
      }
    }

    fetchEmployees()
  }, [showToast])

  const validate = () => {
    const newErrors = {}

    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required'
    }

    if (!formData.machineId) {
      newErrors.machineId = 'Machine ID is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    if (!user) {
      showToast('You must be logged in to start a session', 'error')
      return
    }

    setIsLoading(true)

    try {
      await startWorkSession({
        employeeId: formData.employeeId,
        supervisorId: user.id,
        machineId: formData.machineId,
      })

      showToast('Work session started successfully', 'success')
      onSuccess()
    } catch (error) {
      showToast(
        error?.response?.data?.error || 'Failed to start session',
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Employee"
        value={formData.employeeId}
        onChange={(e) =>
          setFormData({
            ...formData,
            employeeId: e.target.value,
          })
        }
        options={employees.map((e) => ({
          value: e.id,
          label: `${e.firstName} ${e.lastName}`,
        }))}
        error={errors.employeeId}
      />

      <Input
        label="Machine ID"
        value={formData.machineId}
        onChange={(e) =>
          setFormData({
            ...formData,
            machineId: e.target.value,
          })
        }
        placeholder="e.g. MACH-001"
        error={errors.machineId}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button type="submit" isLoading={isLoading}>
          Start Session
        </Button>
      </div>
    </form>
  )
}
