import api from './api'

export const getBreakSessions = async () => {
  const response = await api.get('/api/break-session')
  return response.data
}

export const createBreakSession = async (breakSession) => {
  const response = await api.post('/api/break-session/create', breakSession)
  return response.data
}

export const updateBreakSession = async (id, breakSession) => {
  const response = await api.put(`/api/break-session/${id}`, breakSession)
  return response.data
}

export const deleteBreakSession = async (id) => {
  const response = await api.delete(`/api/break-session/${id}`)
  return response.data
}
