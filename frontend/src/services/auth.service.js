import api from './api'


export const login = async (username, password) => {
  const response = await api.post('/api/auth/login', {
    username,
    password,
  })

  if (response.data && response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
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
    return JSON.parse(userStr)
  }
  return null
}
