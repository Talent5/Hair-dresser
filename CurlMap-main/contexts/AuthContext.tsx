import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, RegisterForm } from '@/types';
import { API_CONFIG } from '@/constants';
import { apiService } from '@/services/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  memberSince: string;
  isVerified: boolean;
  phone?: string;
  bio?: string;
  specialties: string[];
  location: {
    address: string;
    coordinates: [number, number];
  };
  isActive: boolean;
  isStylist: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: 'customer' | 'stylist';
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
};

// Helper function to safely store items in SecureStore
const safeSecureStoreSet = async (key: string, value: string | null | undefined): Promise<boolean> => {
  try {
    if (!value || typeof value !== 'string') {
      console.warn(`Skipping SecureStore.setItem for key "${key}": invalid value`, typeof value);
      return false;
    }
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to store ${key} in SecureStore:`, error);
    return false;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to convert API User to UserProfile
const convertUserToProfile = (apiUser: User, isStylist: boolean = false, stylistProfile?: any): UserProfile => {
  console.log('Converting user to profile:', { 
    apiUser, 
    hasName: !!apiUser.name, 
    name: apiUser.name,
    isStylist,
    stylistProfile: stylistProfile ? 'present' : 'not present',
    fullUser: JSON.stringify(apiUser, null, 2)
  });
  
  // Handle name field - use the name or fallback to 'User'
  const displayName = apiUser.name || 'User';
  
  // Extract specialties from stylist profile if available
  const specialties = stylistProfile?.specialties || [];
  const bio = stylistProfile?.bio || '';
  
  return {
    id: apiUser._id,
    name: displayName,
    email: apiUser.email,
    avatar: apiUser.profileImage,
    rating: 0, // Default values for profile compatibility
    reviewCount: 0,
    memberSince: new Date(apiUser.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    }),
    isVerified: apiUser.isVerified,
    phone: apiUser.phone,
    bio,
    specialties,
    location: {
      address: apiUser.location?.address || '',
      coordinates: apiUser.location?.coordinates || [0, 0],
    },
    isActive: apiUser.isActive,
    isStylist,
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('Auth Context - Initializing auth...');
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Check for stored token
      const token = await SecureStore.getItemAsync('auth_token');
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      const userData = await SecureStore.getItemAsync('user_data');
      
      console.log('Auth Context - Stored data:', { hasToken: !!token, hasRefreshToken: !!refreshToken, hasUserData: !!userData });
      
      if (token && userData) {
        const user = JSON.parse(userData);
        console.log('Auth Context - Parsed stored user data:', { user, hasName: !!user.name, name: user.name });
        
        // Verify token with backend
        try {
          console.log('Auth Context - Verifying token with backend...');
          const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-token`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data.user) {
              const userProfile = convertUserToProfile(
                result.data.user, 
                result.data.user.role === 'stylist',
                result.data.stylistProfile
              );
              
              console.log('Auth Context - Token valid, user authenticated');
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: userProfile,
                token,
              });
              return;
            }
          }
          
          // If token verification failed, try to refresh using refresh token
          if (refreshToken) {
            console.log('Auth Context - Token invalid, attempting refresh...');
            const refreshResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken }),
            });
            
            if (refreshResponse.ok) {
              const refreshResult = await refreshResponse.json();
              if (refreshResult.success && refreshResult.data) {
                const { tokens } = refreshResult.data;
                const userProfile = user; // Use stored user data since refresh doesn't return user
                
                // Store new tokens with validation using safe helper
                await safeSecureStoreSet('auth_token', tokens.accessToken);
                await safeSecureStoreSet('refresh_token', tokens.refreshToken);
                
                console.log('Auth Context - Token refreshed successfully');
                setAuthState({
                  isAuthenticated: true,
                  isLoading: false,
                  user: userProfile,
                  token: tokens.accessToken,
                });
                return;
              }
            }
          }
          
          throw new Error('Token verification and refresh failed');
        } catch (error) {
          console.log('Auth Context - Token verification and refresh failed:', error);
          
          // Check if it's a network error - if so, allow offline access with stored data
          if (error instanceof TypeError && error.message.includes('Network request failed')) {
            console.log('Auth Context - Network error detected, allowing offline access with stored data');
            const userProfile = user; // Use stored user data
            
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              user: userProfile,
              token, // Use stored token even if we can't verify it
            });
            return;
          }
          
          // If not a network error, clear stored data with error handling
          try {
            await SecureStore.deleteItemAsync('auth_token');
          } catch (error) {
            console.log('Error deleting auth_token during cleanup:', error);
          }
          
          try {
            await SecureStore.deleteItemAsync('refresh_token');
          } catch (error) {
            console.log('Error deleting refresh_token during cleanup:', error);
          }
          
          try {
            await SecureStore.deleteItemAsync('user_data');
          } catch (error) {
            console.log('Error deleting user_data during cleanup:', error);
          }
        }
      }
      
      console.log('Auth Context - No valid auth, setting unauthenticated state');
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });
    } catch (error) {
      console.error('Auth Context - Error initializing auth:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Auth Context - Login attempt for:', email);
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await apiService.login({ email, password });
      console.log('Auth Context - Login response:', { success: response.success, hasData: !!response.data });
      
      if (response.success && response.data) {
        const { user, tokens, stylistProfile } = response.data;
        const userProfile = convertUserToProfile(user, !!stylistProfile, stylistProfile);
        
        console.log('Auth Context - Storing auth data and setting authenticated state');
        // Store auth data securely using safe helper
        await safeSecureStoreSet('auth_token', tokens.accessToken);
        await safeSecureStoreSet('refresh_token', tokens.refreshToken);
        await safeSecureStoreSet('user_data', JSON.stringify(userProfile));
        
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: userProfile,
          token: tokens.accessToken,
        });
        
        console.log('Auth Context - Login successful');
        return { success: true };
      } else {
        console.log('Auth Context - Login failed:', response.message);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { 
          success: false, 
          error: response.message || 'Login failed'
        };
      }
    } catch (error: any) {
      console.error('Auth Context - Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return { 
        success: false, 
        error: error.message || 'Network error. Please check your connection.' 
      };
    }
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Prepare registration data for backend
      const registerData: RegisterForm = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.password, // Add confirmPassword field
        role: data.role,
        // Add default location in GeoJSON format (can be updated later)
        location: {
          type: 'Point' as const,
          coordinates: [31.0492, -17.8292] // [longitude, latitude] - Default to Harare coordinates
        }
      };
      
      console.log('Auth Context - Registering user:', { email: registerData.email });
      
      const result = await apiService.register(registerData);
      console.log('Auth Context - Register response:', result);
      
      if (result.success && result.data) {
        const { user, token, refreshToken, stylist } = result.data;
        const userProfile = convertUserToProfile(user, user.role === 'stylist', stylist);
        
        // Store auth data securely with validation and error handling
        try {
          const tokenStored = await safeSecureStoreSet('auth_token', token);
          const refreshTokenStored = await safeSecureStoreSet('refresh_token', refreshToken);
          
          if (userProfile) {
            const userDataString = JSON.stringify(userProfile);
            const userDataStored = await safeSecureStoreSet('user_data', userDataString);
            console.log('Auth Context - Storage results:', { tokenStored, refreshTokenStored, userDataStored });
          }
        } catch (storageError) {
          console.error('Auth Context - Storage error during registration:', storageError);
          // Continue with auth state update even if storage fails
        }
        
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: userProfile,
          token: token,
        });
        
        console.log('Auth Context - Registration successful');
        return { success: true };
      } else {
        console.log('Auth Context - Registration failed:', result.message);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return { 
          success: false, 
          error: result.message || 'Registration failed' 
        };
      }
    } catch (error: any) {
      console.error('Auth Context - Registration error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      // Provide more specific error messages for SecureStore issues
      if (error.message && error.message.includes('SecureStore')) {
        return { 
          success: false, 
          error: 'Storage error occurred. Please try again.' 
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Network error. Please check your connection.' 
      };
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Auth Context - Forgot password request for:', email);
      
      const result = await apiService.forgotPassword(email);
      console.log('Auth Context - Forgot password response:', result);
      
      if (result.success) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: result.message || 'Failed to send reset email' 
        };
      }
    } catch (error: any) {
      console.error('Auth Context - Forgot password error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error. Please check your connection.' 
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Logout from backend
      if (authState.token) {
        try {
          console.log('Auth Context - Logging out user');
          
          await apiService.logout();
          console.log('Auth Context - Logout successful');
        } catch (error) {
          console.log('Backend logout failed, continuing with local logout:', error);
        }
      }
      
      // Clear stored data with error handling
      try {
        await SecureStore.deleteItemAsync('auth_token');
      } catch (error) {
        console.log('Error deleting auth_token:', error);
      }
      
      try {
        await SecureStore.deleteItemAsync('refresh_token');
      } catch (error) {
        console.log('Error deleting refresh_token:', error);
      }
      
      try {
        await SecureStore.deleteItemAsync('user_data');
      } catch (error) {
        console.log('Error deleting user_data:', error);
      }
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      });
      
      console.log('Auth Context - Logout completed');
    } catch (error) {
      console.error('Auth Context - Logout error:', error);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    try {
      if (!authState.user) return;
      
      console.log('Auth Context - Updating profile via API');
      
      // Update User fields (name, phone, location)
      const userUpdates: Partial<User> = {
        name: updates.name,
        phone: updates.phone,
      };
      
      // Transform location if provided
      if (updates.location) {
        userUpdates.location = {
          type: 'Point',
          coordinates: updates.location.coordinates,
          address: updates.location.address,
        };
      }
      
      // Call the API to update user profile
      const userResponse = await apiService.updateProfile(userUpdates);
      
      if (!userResponse.success || !userResponse.data) {
        throw new Error(userResponse.message || 'Failed to update user profile');
      }
      
      // If user is a stylist and bio is being updated, update stylist profile too
      if (authState.user.isStylist && updates.bio !== undefined) {
        try {
          const stylistUpdates = { bio: updates.bio };
          await apiService.updateStylistProfile(stylistUpdates);
          console.log('Auth Context - Stylist bio updated');
        } catch (stylistError) {
          console.warn('Auth Context - Failed to update stylist bio:', stylistError);
          // Don't fail the whole operation if stylist update fails
        }
      }
      
      // Transform the response back to UserProfile format
      const updatedUser = userResponse.data;
      const updatedProfile: UserProfile = {
        ...authState.user,
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.profileImage,
        isVerified: updatedUser.isVerified,
        location: {
          address: updatedUser.location.address || '',
          coordinates: updatedUser.location.coordinates,
        },
        // Keep bio from updates if provided
        ...(updates.bio !== undefined && { bio: updates.bio }),
      };
      
      if (updatedProfile) {
        await safeSecureStoreSet('user_data', JSON.stringify(updatedProfile));
      }
      
      setAuthState(prev => ({
        ...prev,
        user: updatedProfile,
      }));
      
      console.log('Auth Context - Profile updated successfully');
    } catch (error) {
      console.error('Auth Context - Update profile error:', error);
      throw error;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      if (!authState.user || !authState.token) return;
      
      console.log('Auth Context - Refreshing profile');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
        },
      });
      
      const result = await response.json();
      console.log('Auth Context - Verify token response:', result);
      
      if (response.ok && result.success && result.data) {
        const userProfile = convertUserToProfile(
          result.data.user, 
          result.data.user.role === 'stylist'
        );
        if (userProfile) {
          await safeSecureStoreSet('user_data', JSON.stringify(userProfile));
        }
        
        setAuthState(prev => ({
          ...prev,
          user: userProfile,
        }));
        
        console.log('Auth Context - Profile refreshed successfully');
      } else {
        console.log('Auth Context - Profile refresh failed:', result.message);
      }
    } catch (error) {
      console.error('Auth Context - Refresh profile error:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    forgotPassword,
    logout,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;