import api from './api';

export const userService = {
  // Get all users
  getAllUsers: async () => {
    const response = await api.get('/api/auth/users');
    return response.data;
  },

  // Get users by role
  getUsersByRole: async (role) => {
    const response = await api.get(`/api/auth/users/role/${role}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await api.post('/api/auth/users', userData);
    return response.data;
  },

  // Update user (including role)
  updateUser: async (userId, userData) => {
    const response = await api.put(`/api/auth/users/${userId}`, userData);
    return response.data;
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/api/auth/users/${userId}`, { role });
    return response.data;
  },

  // Delete user (soft delete)
  deleteUser: async (userId) => {
    const response = await api.delete(`/api/auth/users/${userId}`);
    return response.data;
  },

  // Link user to process
  linkUserToProcess: async (userId, processId) => {
    const response = await api.post('/api/auth/users/link-process', {
      userId,
      processId
    });
    return response.data;
  }
};

export default userService;
