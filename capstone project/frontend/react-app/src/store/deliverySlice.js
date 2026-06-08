import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as apiService from '../services/apiService';

// ─── Async Thunks ───────────────────────────────────────────

export const fetchAllAgents = createAsyncThunk(
  'delivery/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.fetchAllAgentsAPI();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch agents' });
    }
  }
);

export const fetchAgentById = createAsyncThunk(
  'delivery/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.fetchAgentByIdAPI(id);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch agent' });
    }
  }
);

export const patchAgent = createAsyncThunk(
  'delivery/patch',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiService.patchAgentAPI(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Update failed' });
    }
  }
);

export const deleteAgent = createAsyncThunk(
  'delivery/delete',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.deleteAgentAPI(id);
      return { ...res.data, deletedId: id };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Delete failed' });
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────

const deliverySlice = createSlice({
  name: 'delivery',
  initialState: {
    list: [],
    selectedAgent: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearDeliveryError: (state) => {
      state.error = null;
    },
    clearSelectedAgent: (state) => {
      state.selectedAgent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
      })
      .addCase(fetchAllAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch agents';
      })

      .addCase(fetchAgentById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAgentById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAgent = action.payload.data;
      })
      .addCase(fetchAgentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      .addCase(patchAgent.fulfilled, (state, action) => {
        const updated = action.payload.data;
        if (updated) {
          state.list = state.list.map((a) =>
            a.id === updated.id ? updated : a
          );
        }
      })

      .addCase(deleteAgent.fulfilled, (state, action) => {
        const id = action.payload.deletedId;
        state.list = state.list.filter((a) => a.id !== id);
      });
  },
});

export const { clearDeliveryError, clearSelectedAgent } = deliverySlice.actions;
export default deliverySlice.reducer;
