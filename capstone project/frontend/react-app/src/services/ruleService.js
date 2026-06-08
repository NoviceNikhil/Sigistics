import axios from 'axios';

const API = axios.create({ baseURL: "http://localhost:8000/api" });

export const getRules = async (activeOnly = false, search = '') => {
  const res = await API.get('/rules', { params: { active_only: activeOnly, search } });
  return res.data.data;
};

export const getRuleById = async (id) => {
  const res = await API.get(`/rules/${id}`);
  return res.data.data;
};

export const createRule = async (data) => {
  const res = await API.post('/rules', data);
  return res.data.data;
};

export const updateRule = async (id, data) => {
  const res = await API.patch(`/rules/${id}`, data);
  return res.data.data;
};

export const deleteRule = async (id) => {
  const res = await API.delete(`/rules/${id}`);
  return res.data.data;
};

export const getRuleLogs = async (limit = 1000, search = '', onlyFlagged = false) => {
  const res = await API.get('/rules/logs', { params: { limit, search, only_flagged: onlyFlagged } });
  return res.data.data;
};

export const getLogsByShipment = async (shipmentId) => {
  const res = await API.get(`/rules/logs/shipment/${shipmentId}`);
  return res.data.data;
};
