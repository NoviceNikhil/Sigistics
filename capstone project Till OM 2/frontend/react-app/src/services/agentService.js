import api from './axios';

const API = api;

export const getAgents = async (params) => {
  const res = await API.get('/api/agents', { params });
  return res.data.data;
};

export const getAgentById = async (id) => {
  const res = await API.get(`/api/agents/${id}`);
  return res.data.data;
};

export const createAgent = async (data) => {
  const res = await API.post('/api/agents', data);
  return res.data.data;
};

export const updateAgent = async (id, data) => {
  const res = await API.put(`/api/agents/${id}`, data);
  return res.data.data;
};

export const toggleAvailability = async (id, status) => {
  const res = await API.put(`/api/agents/${id}/availability`, { availability_status: status });
  return res.data.data;
};

export const bulkUploadAgents = async (file, overwrite = false) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await API.post(`/api/agents/upload${overwrite ? '?overwrite=true' : ''}`, formData);
  return res.data.data;
};

export const deleteAgent = async (id) => {
  await API.delete(`/api/agents/${id}`);
};

export const restoreAgent = async (id) => {
  const res = await API.post(`/api/agents/${id}/restore`);
  return res.data.data;
};

export const assignAgent = async (shipmentId, agentId) => {
  const res = await API.post(`/api/agents/assign/${shipmentId}`, { agent_id: agentId });
  return res.data.data;
};