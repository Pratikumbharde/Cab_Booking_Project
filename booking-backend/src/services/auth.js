import api from './api';

export const login = async (email, password) => {
    const response = await api.post(`/auth/login`, { email, password });
    return response.data;
  };

export const register = async (userData, userType) => {
  const response = await api.post(`/${userType}s/register`, userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};