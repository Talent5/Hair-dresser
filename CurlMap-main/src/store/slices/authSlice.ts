import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, Stylist, LoginForm, RegisterForm } from '../../types';
import { apiService } from '../../services/api';
import { TokenService, UserService } from '../../utils/storage';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginForm, { rejectWithValue }) => {
    try {
      const response = await apiService.login(credentials);
      if (response.success && response.data) {
        const { user, stylist, token, refreshToken } = response.data;
        
        // Store tokens and user data
        await TokenService.setToken(token);
        await TokenService.setRefreshToken(refreshToken);
        await UserService.setUser(user);
        
        if (stylist) {
          await UserService.setStylist(stylist);
        }
        
        return { user, stylist, token };
      } else {
        return rejectWithValue(response.message || 'Login failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterForm, { rejectWithValue }) => {
    try {
      const response = await apiService.register(userData);
      if (response.success && response.data) {
        const { user, stylist, token, refreshToken } = response.data;
        
        // Store tokens and user data
        await TokenService.setToken(token);
        await TokenService.setRefreshToken(refreshToken);
        await UserService.setUser(user);
        
        if (stylist) {
          await UserService.setStylist(stylist);
        }
        
        return { user, stylist, token };
      } else {
        return rejectWithValue(response.message || 'Registration failed');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const loadUserFromStorage = createAsyncThunk(
  'auth/loadFromStorage',
  async (_, { rejectWithValue }) => {
    try {
      const token = await TokenService.getToken();
      const user = await UserService.getUser();
      const stylist = await UserService.getStylist();
      
      if (token && user) {
        return { user, stylist, token };
      } else {
        return rejectWithValue('No stored user data');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load user data');
    }
  }
);

export const refreshUserProfile = createAsyncThunk(
  'auth/refreshProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        const { user, stylist } = response.data;
        
        // Update stored user data
        await UserService.setUser(user);
        if (stylist) {
          await UserService.setStylist(stylist);
        }
        
        return { user, stylist };
      } else {
        return rejectWithValue(response.message || 'Failed to refresh profile');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to refresh profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await apiService.updateProfile(userData);
      if (response.success && response.data) {
        // Update stored user data
        await UserService.setUser(response.data);
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const updateStylistProfile = createAsyncThunk(
  'auth/updateStylistProfile',
  async (stylistData: Partial<Stylist>, { rejectWithValue }) => {
    try {
      const response = await apiService.updateStylistProfile(stylistData);
      if (response.success && response.data) {
        // Update stored stylist data
        await UserService.setStylist(response.data);
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Failed to update stylist profile');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update stylist profile');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
      
      // Clear all stored data
      await TokenService.clearAll();
      await UserService.removeUser();
      await UserService.removeStylist();
      
      return null;
    } catch (error: any) {
      // Even if API call fails, clear local data
      await TokenService.clearAll();
      await UserService.removeUser();
      await UserService.removeStylist();
      
      return null;
    }
  }
);

// Initial state
const initialState: AuthState = {
  user: null,
  stylist: null,
  token: null,
  isLoading: false,
  error: null,
};

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    updateStylist: (state, action: PayloadAction<Stylist>) => {
      state.stylist = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.stylist = action.payload.stylist || null;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.user = null;
        state.stylist = null;
        state.token = null;
      });

    // Register user
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.stylist = action.payload.stylist || null;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.user = null;
        state.stylist = null;
        state.token = null;
      });

    // Load user from storage
    builder
      .addCase(loadUserFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.stylist = action.payload.stylist || null;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loadUserFromStorage.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.stylist = null;
        state.token = null;
      });

    // Refresh user profile
    builder
      .addCase(refreshUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.stylist = action.payload.stylist || null;
        state.error = null;
      })
      .addCase(refreshUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update user profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update stylist profile
    builder
      .addCase(updateStylistProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateStylistProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stylist = action.payload;
        state.error = null;
      })
      .addCase(updateStylistProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.stylist = null;
        state.token = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.stylist = null;
        state.token = null;
        state.error = null;
      });
  },
});

export const { clearError, setLoading, updateUser, updateStylist } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectStylist = (state: { auth: AuthState }) => state.auth.stylist;
export const selectIsAuthenticated = (state: { auth: AuthState }) => !!state.auth.token;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;