import api from './api';

export const getShiftTimes = async () => {
  const response = await api.get('/api/shift-times');
  return response.data;
};

export const upsertShiftTimes = async (payload) => {
  const response = await api.put('/api/shift-times', payload);
  return response.data;
};
