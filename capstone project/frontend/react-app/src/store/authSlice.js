import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as apiService from '../services/apiService';

// ─── Async Thunks ───────────────────────────────────────────

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await apiService.loginUserAPI(credentials);
      return res.data;
    } catch (err) {
      // include HTTP status so the UI can detect 429 lockouts
      return rejectWithValue({
        ...( err.response?.data || { message: 'Login failed' }),
        status: err.response?.status,
      });
    }
  }
);

export const loginStaff = createAsyncThunk(
  'auth/loginStaff',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await apiService.loginStaffAPI(credentials);
      return { ...res.data, loginRole: credentials.role };
    } catch (err) {
      // include HTTP status so the UI can detect 429 lockouts
      return rejectWithValue({
        ...( err.response?.data || { message: 'Login failed' }),
        status: err.response?.status,
      });
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signupUser',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await apiService.signupUserAPI(userData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Signup failed' });
    }
  }
);

export const signupDelivery = createAsyncThunk(
  'auth/signupDelivery',
  async (agentData, { rejectWithValue }) => {
    try {
      const res = await apiService.signupDeliveryAPI(agentData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Signup failed' });
    }
  }
);

export const verifyUserOtp = createAsyncThunk(
  'auth/verifyUserOtp',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiService.verifyUserOtpAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'OTP verification failed' });
    }
  }
);

export const verifyAdminOtp = createAsyncThunk(
  'auth/verifyAdminOtp',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiService.verifyAdminOtpAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'OTP verification failed' });
    }
  }
);

export const verifyDeliveryOtp = createAsyncThunk(
  'auth/verifyDeliveryOtp',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiService.verifyDeliveryOtpAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'OTP verification failed' });
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiService.forgotPasswordAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to send OTP' });
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiService.resetPasswordAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Reset failed' });
    }
  }
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiService.resendOtpAPI(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to resend OTP' });
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.fetchProfileAPI();
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Failed to fetch profile' });
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async ({ role, ...data }, { dispatch, rejectWithValue }) => {
    try {
      let res;
      if (role === 'delivery') {
        res = await apiService.updateDeliveryProfileAPI(data);
      } else {
        res = await apiService.updateUserProfileAPI(data);
      }

      // Auto-refresh profile after update (awaited so Redux state is updated before toast fires)
      await dispatch(fetchProfile());
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Update failed' });
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async ({ role }, { rejectWithValue }) => {
    try {
      let res;
      if (role === 'delivery') {
        res = await apiService.deleteDeliveryProfileAPI();
      } else {
        res = await apiService.deleteUserProfileAPI();
      }
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Delete failed' });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logoutAPI();
      return {};
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: 'Logout failed' });
    }
  }
);

// ─── Initial State ──────────────────────────────────────────

const storedUser = localStorage.getItem('user');
const storedToken = localStorage.getItem('token');
const storedRole = localStorage.getItem('role');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  role: storedRole || null,
  isAuthenticated: !!storedToken || !!storedUser,
  loading: false,
  error: null,

  // OTP flow state
  otpEmail: null,
  otpType: null,
  otpRole: null,

  // Reset password
  resetToken: null,
  resetEmail: null,

  // Profile
  profileLoading: false,
};

// ─── Slice ──────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearOtpState: (state) => {
      state.otpEmail = null;
      state.otpType = null;
      state.otpRole = null;
    },
    setOtpFlow: (state, action) => {
      state.otpEmail = action.payload.email;
      state.otpType = action.payload.type;
      state.otpRole = action.payload.role;
    },
    clearResetToken: (state) => {
      state.resetToken = null;
      state.resetEmail = null;
    },
    fullLogout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.otpEmail = null;
      state.otpType = null;
      state.otpRole = null;
      state.resetToken = null;
      state.resetEmail = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    },
  },
  extraReducers: (builder) => {
    // ── Login User ──
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        if (data?.isAdmin) {
          state.otpEmail = data.email;
          state.otpType = 'admin';
          state.otpRole = 'admin';
        } else if (data?.token) {
          state.token = data.token;
          state.user = data.user;
          state.role = data.user?.role || 'user';
          state.isAuthenticated = true;
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('role', data.user?.role || 'user');
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Login failed';
      })

      // ── Login Staff ──
      .addCase(loginStaff.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginStaff.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        const loginRole = action.payload.loginRole;

        if (data?.isAdmin) {
          state.otpEmail = data.email;
          state.otpType = 'admin';
          state.otpRole = 'admin';
        } else if (data?.token) {
          state.token = data.token;
          state.user = data.user;
          state.role = loginRole || data.role || 'delivery';
          state.isAuthenticated = true;
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('role', loginRole || data.role || 'delivery');
        }
      })
      .addCase(loginStaff.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Staff login failed';
      })

      // ── Signup User ──
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        state.otpEmail = data?.email;
        state.otpType = 'signup';
        state.otpRole = 'user';
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Signup failed';
      })

      // ── Signup Delivery ──
      .addCase(signupDelivery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupDelivery.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        state.otpEmail = data?.email;
        state.otpType = 'signup';
        state.otpRole = 'delivery';
      })
      .addCase(signupDelivery.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Delivery signup failed';
      })

      // ── Verify User OTP ──
      .addCase(verifyUserOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyUserOtp.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        if (data?.token) {
          state.token = data.token;
          state.user = data.user;
          state.role = data.user?.role || 'user';
          state.isAuthenticated = true;
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('role', data.user?.role || 'user');
        }
        if (data?.resetToken) {
          state.resetToken = data.resetToken;
          state.resetEmail = state.otpEmail;
        }
        state.otpEmail = null;
        state.otpType = null;
        state.otpRole = null;
      })
      .addCase(verifyUserOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'OTP verification failed';
      })

      // ── Verify Admin OTP ──
      .addCase(verifyAdminOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyAdminOtp.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        if (data?.token) {
          state.token = data.token;
          state.user = data.user;
          state.role = 'admin';
          state.isAuthenticated = true;
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('role', 'admin');
        }
        state.otpEmail = null;
        state.otpType = null;
        state.otpRole = null;
      })
      .addCase(verifyAdminOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Admin OTP failed';
      })

      // ── Verify Delivery OTP ──
      .addCase(verifyDeliveryOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyDeliveryOtp.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        if (data?.resetToken) {
          state.resetToken = data.resetToken;
          state.resetEmail = state.otpEmail;
        }
        state.otpEmail = null;
        state.otpType = null;
        state.otpRole = null;
      })
      .addCase(verifyDeliveryOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Delivery OTP failed';
      })

      // ── Forgot Password ──
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data;
        state.otpEmail = data?.email;
        state.otpType = 'forgot';
        state.otpRole = data?.role || 'user';
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to send OTP';
      })

      // ── Reset Password ──
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.resetToken = null;
        state.resetEmail = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Reset failed';
      })

      // ── Fetch Profile ──
      .addCase(fetchProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        const data = action.payload.data;
        if (data) {
          state.user = data;
          state.role = data.role || 'user';
          state.isAuthenticated = true;
          localStorage.setItem('user', JSON.stringify(data));
          localStorage.setItem('role', data.role || 'user');
        }
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.profileLoading = false;
      })

      // ── Update Profile ──
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Data is refreshed by fetchProfile dispatch inside updateProfile thunk
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Update failed';
      })

      // ── Delete Account ──
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      })

      // ── Logout ──
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      });
  },
});

export const { clearError, clearOtpState, setOtpFlow, clearResetToken, fullLogout } = authSlice.actions;
export default authSlice.reducer;
