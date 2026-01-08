import api from './api'

export const getEmployees = async (employeeType) => {
  const params = employeeType && employeeType !== 'all' ? { employeeType } : {};
  const response = await api.get('/api/employees', { params });
  // The backend returns an array directly
  return response.data;
}

export const getEmployee = async (id) => {
  const response = await api.get(`/api/employees/${id}`)
  return response.data;
}

export const createEmployee = async (employee) => {
  const response = await api.post('/api/employees', employee)
  return response.data.data
}

export const updateEmployee = async (id, employee) => {
  const response = await api.put(`/api/employees/${id}`, employee)
  return response.data.data
}

export const deleteEmployee = async (id) => {
  const response = await api.delete(`/api/employees/${id}`);
  // The backend returns a message, not a success boolean
  return response.data;
}
