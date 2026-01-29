import React, { useState } from 'react'
import { Button } from '../UI/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { useToast } from '../../hooks/useToast'
import { createUser, updateUser } from '../../services/auth.service'

export const UserForm = ({ initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    username: initialData?.username || '',
    password: '',
    name: initialData?.name || '',
    role: initialData?.role || '',
    email: initialData?.email || '',
    contactNumber: initialData?.contactNumber || '',
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  const { showToast } = useToast()

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'security', label: 'Security' },
    { value: 'process', label: 'Process' },
  ]

  const validate = () => {
    const newErrors = {}

    if (!formData.username || formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    if (!initialData && (!formData.password || formData.password.length < 6)) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    try {
      const payload = { ...formData }
      
      // Remove password if not provided for update
      if (initialData && !payload.password) {
        delete payload.password
      }

      if (initialData) {
        await updateUser(initialData._id, payload)
        showToast('User updated successfully', 'success')
      } else {
        await createUser(payload)
        showToast('User created successfully', 'success')
      }
      onSuccess()
    } catch (error) {
      showToast(
        error?.response?.data?.message || 'Operation failed',
        'error'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        error={errors.username}
        disabled={!!initialData}
      />

      <Input
        label={initialData ? 'Password (leave blank to keep current)' : 'Password'}
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
      />

      <Input
        label="Full Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
      />

      <Select
        label="Role"
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        options={roleOptions}
        error={errors.role}
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
      />

      <Input
        label="Contact Number"
        value={formData.contactNumber}
        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
        error={errors.contactNumber}
      />

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  )
}
