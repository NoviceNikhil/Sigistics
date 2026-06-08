import api from './axios';

export const getAgentDeliveries = async (params = {}) => {
  const res = await api.get('/api/agent/deliveries', { params });
  return res.data.data;
};

export const getAgentDeliveryDetail = async (id) => {
  const res = await api.get(`/api/agent/deliveries/${id}`);
  return res.data.data;
};

export const updateAgentDeliveryStatus = async (id, payload) => {
  const res = await api.put(`/api/agent/deliveries/${id}/status`, payload);
  return res.data.data;
};

export const updateAgentDeliveryLocation = async (id, payload) => {
  const res = await api.put(`/api/agent/deliveries/${id}/location`, payload);
  return res.data.data;
};

export const updateAgentAvailability = async (payload) => {
  const res = await api.put('/api/agent/availability', payload);
  return res.data.data;
};
