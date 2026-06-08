export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  DELIVERY: 'delivery',
};

export const OTP_TYPES = {
  SIGNUP: 'signup',
  FORGOT: 'forgot',
};

export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Sa95BQuRhIWU8v';
