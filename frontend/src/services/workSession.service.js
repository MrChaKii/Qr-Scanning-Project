import api from './api'

// Back-compat: getWorkSessions(statusString)
// New: getWorkSessions({ date: 'YYYY-MM-DD' })
export const getWorkSessions = async (arg) => {
  const params = {}
  if (typeof arg === 'string' && arg) {
    params.status = arg
  } else if (arg && typeof arg === 'object') {
    if (arg.date) params.date = arg.date
  }
  const response = await api.get('/api/work-session', {
    params,
  })
  return response.data.sessions || []
}

export const startWorkSession = async (data) => {
  const response = await api.post('/api/work-session/start', data)
  return response.data.session
}

export const stopWorkSession = async (id) => {
  const response = await api.post(`/api/work-session/${id}/stop`)
  return response.data.session
}
