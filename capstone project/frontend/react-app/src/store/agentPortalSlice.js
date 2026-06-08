import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as agentPortalService from '../services/agentPortalService';
import { fetchProfile } from './authSlice';

export const fetchAgentDeliveries = createAsyncThunk(
  'agentPortal/fetchDeliveries',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await agentPortalService.getAgentDeliveries(params);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch deliveries' });
    }
  },
);

export const fetchAgentDeliveryDetail = createAsyncThunk(
  'agentPortal/fetchDeliveryDetail',
  async (id, { rejectWithValue }) => {
    try {
      return await agentPortalService.getAgentDeliveryDetail(id);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch delivery' });
    }
  },
);

export const updateAgentDeliveryStatusThunk = createAsyncThunk(
  'agentPortal/updateDeliveryStatus',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await agentPortalService.updateAgentDeliveryStatus(id, payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to update delivery' });
    }
  },
);

export const updateAgentAvailabilityThunk = createAsyncThunk(
  'agentPortal/updateAvailability',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const result = await agentPortalService.updateAgentAvailability(payload);
      await dispatch(fetchProfile());
      return result;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to update availability' });
    }
  },
);

export const updateAgentDeliveryLocationThunk = createAsyncThunk(
  'agentPortal/updateDeliveryLocation',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await agentPortalService.updateAgentDeliveryLocation(id, payload);
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to update checkpoint' });
    }
  },
);

const initialState = {
  deliveries: [],
  meta: null,
  summary: null,
  selectedDelivery: null,
  history: [],
  allowedNextStatuses: [],
  loading: false,
  detailLoading: false,
  actionLoading: false,
  error: null,
};

const agentPortalSlice = createSlice({
  name: 'agentPortal',
  initialState,
  reducers: {
    clearAgentPortalError: (state) => {
      state.error = null;
    },
    clearSelectedDelivery: (state) => {
      state.selectedDelivery = null;
      state.history = [];
      state.allowedNextStatuses = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgentDeliveries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgentDeliveries.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveries = action.payload.deliveries || [];
        state.meta = action.payload.meta || null;
        state.summary = action.payload.summary || null;
      })
      .addCase(fetchAgentDeliveries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch deliveries';
      })
      .addCase(fetchAgentDeliveryDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchAgentDeliveryDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedDelivery = action.payload.shipment || null;
        state.history = action.payload.history || [];
        state.allowedNextStatuses = action.payload.allowed_next_statuses || [];
      })
      .addCase(fetchAgentDeliveryDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload?.message || 'Failed to fetch delivery';
      })
      .addCase(updateAgentDeliveryStatusThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAgentDeliveryStatusThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        const shipment = action.payload.shipment || null;
        const previousStatus =
          state.selectedDelivery?.id === shipment?.id
            ? state.selectedDelivery?.status
            : state.deliveries.find((delivery) => delivery.id === shipment?.id)?.status;
        state.selectedDelivery = shipment;
        state.history = action.payload.history || [];
        state.allowedNextStatuses = action.payload.allowed_next_statuses || [];
        if (shipment) {
          state.deliveries = state.deliveries.map((delivery) =>
            delivery.id === shipment.id ? { ...delivery, ...shipment } : delivery,
          );
          if (state.summary) {
            const activeStatuses = ['assigned', 'picked', 'in_transit'];
            if (previousStatus && activeStatuses.includes(previousStatus) && !activeStatuses.includes(shipment.status)) {
              state.summary.active = Math.max((state.summary.active || 0) - 1, 0);
            }
            if (previousStatus && !activeStatuses.includes(previousStatus) && activeStatuses.includes(shipment.status)) {
              state.summary.active = (state.summary.active || 0) + 1;
            }
            if (previousStatus !== 'delivered' && shipment.status === 'delivered') {
              state.summary.delivered = (state.summary.delivered || 0) + 1;
            }
          }
        }
      })
      .addCase(updateAgentDeliveryStatusThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || 'Failed to update delivery';
      })
      .addCase(updateAgentAvailabilityThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAgentAvailabilityThunk.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateAgentAvailabilityThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || 'Failed to update availability';
      })
      .addCase(updateAgentDeliveryLocationThunk.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAgentDeliveryLocationThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        const shipment = action.payload.shipment || null;
        state.selectedDelivery = shipment;
        state.history = action.payload.history || [];
        state.allowedNextStatuses = action.payload.allowed_next_statuses || [];
        if (shipment) {
          state.deliveries = state.deliveries.map((delivery) =>
            delivery.id === shipment.id ? { ...delivery, ...shipment } : delivery,
          );
        }
      })
      .addCase(updateAgentDeliveryLocationThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload?.message || 'Failed to update checkpoint';
      });
  },
});

export const { clearAgentPortalError, clearSelectedDelivery } = agentPortalSlice.actions;
export default agentPortalSlice.reducer;
