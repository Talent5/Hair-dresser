import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/**
 * Custom hook for accessing authentication context
 * Separated to avoid fast refresh issues
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};