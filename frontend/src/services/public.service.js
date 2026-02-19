import api from './api'

export const getPublicDashboardSummary = async () => {
  const response = await api.get('/api/public/dashboard-summary')
  return response.data
}

export const getPublicEmployeeDailyIdleTime = async (date) => {
  const response = await api.get('/api/public/employee-idle/daily', {
    params: { date },
  })
  return response.data?.rows || []
}
