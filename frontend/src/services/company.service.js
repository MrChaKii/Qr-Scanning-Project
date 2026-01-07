export const deleteCompany = async (companyId) => {
  return api.delete(`/api/companies/${companyId}`);
};
import api from './api'

export const getCompanies = async () => {
  const response = await api.get('/api/companies')
  return response.data.data
}

export const getCompany = async (id) => {
  const response = await api.get(`/api/companies/${id}`)
  return response.data.data
}

export const createCompany = async (company) => {
  const response = await api.post('/api/companies', company)
  return response.data.data
}

export const updateCompany = async (id, company) => {
  const response = await api.put(`/api/companies/${id}`, company)
  return response.data.data
}
