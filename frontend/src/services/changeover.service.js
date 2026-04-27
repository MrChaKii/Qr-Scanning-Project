import api from './api'

export const getChangeovers = async (date) => {
  const response = await api.get('/api/changeovers', {
    params: { date },
  })
  return response.data
}

export const createChangeover = async ({ date, durationMinutes, note }) => {
  const response = await api.post('/api/changeovers', {
    date,
    durationMinutes,
    ...(note ? { note } : {}),
  })
  return response.data
}

export const deleteChangeover = async (id) => {
  const response = await api.delete(`/api/changeovers/${id}`)
  return response.data
}
