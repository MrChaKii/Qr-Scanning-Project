import api from './api'

export const getWorkSessions = async (status) => {
  const params = status ? { status } : {}
  const response = await api.get('/api/work-sessions', {
    params,
  })
  return response.data.data
}

export const startWorkSession = async (data) => {
  const response = await api.post('/api/work-sessions/start', data)
  return response.data.data
}

export const stopWorkSession = async (id) => {
  const response = await api.post(`/api/work-sessions/${id}/stop`)
  return response.data.data
}
