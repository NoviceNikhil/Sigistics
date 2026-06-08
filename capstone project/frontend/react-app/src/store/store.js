import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import deliveryReducer from './deliverySlice';
import agentPortalReducer from './agentPortalSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    delivery: deliveryReducer,
    agentPortal: agentPortalReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;
