export const API_BASE_URL = 'http://localhost:5000'

export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  SECURITY: 'security',
  PROCESS: 'process',
}

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'security', label: 'Security' },
  { value: 'process', label: 'Process' }
]

export const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-800',
  supervisor: 'bg-blue-100 text-blue-800',
  security: 'bg-green-100 text-green-800',
  process: 'bg-yellow-100 text-yellow-800'
}

export const ROLE_DESCRIPTIONS = {
  admin: 'Full system access',
  supervisor: 'Manage employees and processes',
  security: 'Scan attendance and manage access',
  process: 'Manage specific process operations'
}

export const EMPLOYEE_TYPES = {
  PERMANENT: 'permanent',
  MANPOWER: 'manpower',
}

export const ATTENDANCE_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
}

export const WORK_SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
}
