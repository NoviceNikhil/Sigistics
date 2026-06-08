import api from './axios';

// ─── AUTHENTICATION API ──────────────────────────────────────

export const loginUserAPI = async (credentials) => {
  return await api.post('/auth/login/user', credentials);
};

export const loginStaffAPI = async (credentials) => {
  return await api.post('/auth/login/staff', credentials);
};

export const signupUserAPI = async (userData) => {
  return await api.post('/auth/signup/user', userData);
};

export const signupDeliveryAPI = async (agentData) => {
  return await api.post('/auth/signup/delivery', agentData);
};

export const verifyUserOtpAPI = async (data) => {
  return await api.post('/auth/verify-otp/user', data);
};

export const verifyAdminOtpAPI = async (data) => {
  return await api.post('/auth/verify-otp/admin', data);
};

export const verifyDeliveryOtpAPI = async (data) => {
  return await api.post('/auth/verify-otp/delivery', data);
};

export const forgotPasswordAPI = async (data) => {
  return await api.post('/auth/forgot-password', data);
};

export const resetPasswordAPI = async (data) => {
  return await api.post('/auth/reset-password', data);
};

export const resendOtpAPI = async (data) => {
  return await api.post('/auth/resend-otp', data);
};

// Profile APIs
export const fetchProfileAPI = async () => {
  return await api.get('/auth/profile');
};

export const updateUserProfileAPI = async (data) => {
  return await api.patch('/user/profile', data);
};

export const updateDeliveryProfileAPI = async (data) => {
  return await api.patch('/deliveryagent/profile', data);
};

export const deleteUserProfileAPI = async () => {
  return await api.delete('/user/profile');
};

export const deleteDeliveryProfileAPI = async () => {
  return await api.delete('/deliveryagent/profile');
};

export const logoutAPI = async () => {
  return await api.post('/auth/logout');
};

// ─── ADMIN USER API ──────────────────────────────────────────

export const fetchAllUsersAPI = async () => {
  return await api.get('/user/');
};

export const fetchUserByIdAPI = async (id) => {
  return await api.get(`/user/${id}`);
};

export const patchUserAPI = async (id, data) => {
  return await api.patch(`/user/${id}`, data);
};

export const deleteUserAPI = async (id) => {
  return await api.delete(`/user/${id}`);
};

// ─── ADMIN DELIVERY API ──────────────────────────────────────

export const fetchAllAgentsAPI = async () => {
  return await api.get('/deliveryagent/');
};

export const fetchAgentByIdAPI = async (id) => {
  return await api.get(`/deliveryagent/${id}`);
};

export const patchAgentAPI = async (id, data) => {
  return await api.patch(`/deliveryagent/${id}`, data);
};

export const deleteAgentAPI = async (id) => {
  return await api.delete(`/deliveryagent/${id}`);
};
