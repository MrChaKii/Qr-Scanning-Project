import api from './api'

export const getPublicDashboardSummary = async () => {
  const response = await api.get('/api/public/dashboard-summary')
  return response.data
}
