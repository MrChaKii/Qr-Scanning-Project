import api from './api'

export const getManpowerDailyHoursByCompany = async (date) => {
  const response = await api.get('/api/report/analytics/manpower-hours/daily', {
    params: { date },
  })
  return response.data?.rows || []
}

export const getManpowerDailyAverageHoursByCompany = async (date) => {
  const response = await api.get('/api/report/analytics/manpower-hours/daily-average', {
    params: { date },
  })
  return response.data?.rows || []
}

export const getManpowerMonthlyHoursByCompany = async (month) => {
  const response = await api.get('/api/report/analytics/manpower-hours/monthly', {
    params: { month },
  })
  return response.data?.rows || []
}

export const getEmployeeDailyIdleTime = async (date) => {
  const response = await api.get('/api/report/analytics/employee-idle/daily', {
    params: { date },
  })
  return response.data?.rows || []
}
