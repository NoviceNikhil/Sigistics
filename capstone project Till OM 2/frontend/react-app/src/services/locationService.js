import api from './axios';

const API = api;

export const getLocations = async (params) => {
  const res = await API.get('/api/locations', { params });
  return res.data.data;
};

export const getPublicLocations = async (params) => {
  const res = await API.get('/api/locations/public', { params });
  return res.data.data;
};

export const getLocationById = async (id) => {
  const res = await API.get(`/api/locations/${id}`);
  return res.data.data;
};

export const createLocation = async (data) => {
  const res = await API.post('/api/locations', data);
  return res.data.data;
};

export const deleteLocation = async (id) => {
  const res = await API.delete(`/api/locations/${id}`);
  return res.data;
};

export const restoreLocation = async (id) => {
  const res = await API.patch(`/api/locations/${id}/restore`);
  return res.data.data;
};
