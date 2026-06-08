import api from './axios';

export const createOrder = async (data) => {
  const res = await api.post('/api/payment/create-order', data);
  return res.data;
};

export const verifyPayment = async (data) => {
  const res = await api.post('/api/payment/verify-payment', data);
  return res.data;
};
