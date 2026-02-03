import api from './api'


export const login = async (username, password, rememberMe = true) => {
  const response = await api.post('/api/auth/login', {
    username,
    password,
    rememberMe,
  })

  if (response.data && response.data.token) {
    const user = response.data.user
      ? {
          ...response.data.user,
          role:
            typeof response.data.user.role === 'string'
              ? response.data.user.role.toLowerCase()
              : response.data.user.role,
        }
      : null
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(user))
  }

  return response.data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    const user = JSON.parse(userStr)
    if (user && typeof user.role === 'string') {
      return { ...user, role: user.role.toLowerCase() }
    }
    return user
  }
  return null
}

// Get all users
export const getAllUsers = async () => {
  const response = await api.get('/api/auth/users')
  return response.data
}

// Get users by role
export const getUsersByRole = async (role) => {
  const response = await api.get(`/api/auth/users/role/${role}`)
  return response.data.data
}

// Link user to process
export const linkUserToProcess = async (userId, processId) => {
  const response = await api.post('/api/auth/users/link-process', {
    userId,
    processId
  })
  return response.data
}

// Create user
export const createUser = async (userData) => {
  const response = await api.post('/api/auth/users', userData)
  return response.data
}

// Update user
export const updateUser = async (id, userData) => {
  const response = await api.put(`/api/auth/users/${id}`, userData)
  return response.data
}

// Delete user
export const deleteUser = async (id) => {
  const response = await api.delete(`/api/auth/users/${id}`)
  return response.data
}
