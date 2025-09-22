import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import CommandPalette from './components/widgets/CommandPalette';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Stylists from './pages/Stylists';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import './App.css';

/**
 * Theme Manager Component
 * Handles dark/light mode toggling and theme persistence
 */
const ThemeManager = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return React.cloneElement(children, { isDarkMode, toggleTheme });
};

/**
 * App Router Component
 * Handles routing between authenticated and unauthenticated states
 */
const AppRouter = ({ isDarkMode, toggleTheme }) => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="stylists" element={<Stylists />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="payments" element={<Payments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings isDarkMode={isDarkMode} toggleTheme={toggleTheme} />} />
        </Route>

        {/* Catch-all redirect */}
        <Route 
          path="*" 
          element={
            <Navigate 
              to={isAuthenticated ? "/dashboard" : "/login"} 
              replace 
            />
          } 
        />
      </Routes>
      
      {/* Global Command Palette - Available on all authenticated routes */}
      {isAuthenticated && <CommandPalette />}
    </>
  );
};

/**
 * Main App Component
 * Provides authentication context, theming, and routing
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 transition-all duration-500">
          <ThemeManager>
            <AppRouter />
          </ThemeManager>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
