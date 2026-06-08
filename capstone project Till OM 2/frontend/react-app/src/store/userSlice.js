import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as apiService from '../services/apiService';

// ─── Async Thunks ───────────────────────────────────────────

export const fetchAllUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.fetchAllUsersAPI();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch users' });
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.fetchUserByIdAPI(id);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch user' });
    }
  }
);

export const patchUser = createAsyncThunk(
  'users/patch',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await apiService.patchUserAPI(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Update failed' });
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.deleteUserAPI(id);
      return { ...res.data, deletedId: id };
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Delete failed' });
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────

const userSlice = createSlice({
  name: 'users',
  initialState: {
    list: [],
    selectedUser: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch users';
      })

      // Fetch by ID
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload.data;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })

      // Patch
      .addCase(patchUser.fulfilled, (state, action) => {
        const updated = action.payload.data;
        if (updated) {
          state.list = state.list.map((u) =>
            u.id === updated.id ? updated : u
          );
        }
      })

      // Delete
      .addCase(deleteUser.fulfilled, (state, action) => {
        const id = action.payload.deletedId;
        state.list = state.list.filter((u) => u.id !== id);
      });
  },
});

export const { clearUserError, clearSelectedUser } = userSlice.actions;
export default userSlice.reducer;
