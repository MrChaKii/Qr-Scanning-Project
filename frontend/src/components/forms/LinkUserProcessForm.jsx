import React, { useEffect, useState } from 'react'
import { Button } from '../UI/Button'
import { Select } from '../ui/Select'
import { useToast } from '../../hooks/useToast'
import { getUsersByRole, linkUserToProcess } from '../../services/auth.service'
import { getAllProcesses } from '../../services/process.service'

export const LinkUserProcessForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    userId: '',
    processId: '',
  })

  const [processUsers, setProcessUsers] = useState([])
  const [processes, setProcesses] = useState([])
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const { showToast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users with process role
        const users = await getUsersByRole('process')
        setProcessUsers(users)

        // Fetch all processes
        const processData = await getAllProcesses()
        setProcesses(processData)
      } catch (error) {
        showToast('Failed to load data', 'error')
      }
    }

    fetchData()
  }, [showToast])

  const validate = () => {
    const newErrors = {}
    if (!formData.userId) {
      newErrors.userId = 'User is required'
    }
    if (!formData.processId) {
      newErrors.processId = 'Process is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      await linkUserToProcess(formData.userId, formData.processId)
      showToast('User linked to process successfully', 'success')
      onSuccess()
    } catch (error) {
      showToast(
        error?.response?.data?.message || 'Failed to link user to process',
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const userOptions = processUsers.map((user) => ({
    value: user._id,
    label: `${user.name} (${user.username})`,
  }))

  const processOptions = processes.map((process) => ({
    value: process.processId,
    label: `${process.processName} (${process.processId})`,
  }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Select User (Process Role)"
        value={formData.userId}
        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
        options={userOptions}
        error={errors.userId}
      />

      <Select
        label="Select Process"
        value={formData.processId}
        onChange={(e) => setFormData({ ...formData, processId: e.target.value })}
        options={processOptions}
        error={errors.processId}
      />

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Linking...' : 'Link User to Process'}
        </Button>
      </div>
    </form>
  )
}
