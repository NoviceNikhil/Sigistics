import api from './axios';

const API = api;

export const getShipments = async (params) => {
  const res = await API.get('/api/shipments', { params });
  return res.data.data;
};

export const getShipmentById = async (id) => {
  const res = await API.get(`/api/shipments/${id}`);
  return res.data.data;
};

export const updateShipmentStatus = async (id, statusData) => {
  const res = await API.patch(`/api/shipments/${id}/status`, statusData);
  return res.data.data;
};

export const updateShipmentDetails = async (id, details) => {
  const res = await API.patch(`/api/shipments/${id}/details`, details);
  return res.data.data;
};

export const deleteShipment = async (id) => {
  const res = await API.delete(`/api/shipments/${id}`);
  return res.data;
};

export const restoreShipment = async (id) => {
  const res = await API.post(`/api/shipments/${id}/restore`);
  return res.data.data;
};

export const getShipmentHistory = async (id) => {
  const res = await API.get(`/api/shipments/${id}/history`);
  return res.data.data;
};

export const bulkUploadShipments = async (file, overwrite = false) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await API.post(`/api/shipments/upload${overwrite ? '?overwrite=true' : ''}`, formData);
  return res.data.data;
};

// Triggers the backend to auto-assign the best available agent to every unassigned shipment
export const bulkAutoAssign = async () => {
  const res = await API.post('/api/agents/bulk-assign');
  return res.data;
};

export const syncRules = async () => {
  const res = await API.post('/api/shipments/sync-rules');
  return res.data;
};



// ── Customer / User-facing shipment endpoints ─────────────────────────────────
// These hit /api/customer/shipments (UserShipmentController, jwt-protected)

export const createShipment = async (payload) => {
  const res = await API.post('/api/customer/shipments', payload);
  return res.data; // { success, message, data: { id, ... } }
};

export const getCustomerShipments = async (params) => {
  const res = await API.get('/api/customer/shipments', { params });
  return res.data.data;
};

export const getCustomerShipmentById = async (id) => {
  const res = await API.get(`/api/customer/shipments/${id}`);
  return res.data.data;
};

export const getCustomerDashboard = async () => {
  const res = await API.get('/api/customer/shipments/dashboard');
  return res.data.data;
};

