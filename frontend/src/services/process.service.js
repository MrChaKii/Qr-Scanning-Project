import api from './api';

export const getProcesses = async () => {
  const response = await api.get('/api/processes');
  return response.data.data;
};

export const getProcess = async (processId) => {
  const response = await api.get(`/api/processes/${processId}`);
  return response.data.data;
};

export const getProcessesByCompany = async (companyId) => {
  const response = await api.get(`/api/processes/company/${companyId}`);
  return response.data.data;
};

export const getProcessesByUser = async (userId) => {
  const response = await api.get(`/api/processes/user/${userId}`);
  return response.data.data;
};

export const createProcess = async (process) => {
  const response = await api.post('/api/processes', process);
  return response.data.process;
};

export const updateProcess = async (processId, process) => {
  const response = await api.put(`/api/processes/${processId}`, process);
  return response.data.process;
};

export const deleteProcess = async (processId) => {
  return api.delete(`/api/processes/${processId}`);
};
