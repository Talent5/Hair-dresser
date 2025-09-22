import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  ScissorsIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  MagnifyingGlassIcon,
  CommandLineIcon,
  SparklesIcon,
  EyeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/useAuth';

/**
 * Navigation Item Component with Enhanced Styling
 */
const NavigationItem = ({ item, isActive, onClick, isCollapsed = false }) => {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 glow-primary'
          : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-105'
      }`}
    >
      <item.icon className={`flex-shrink-0 h-5 w-5 mr-3 transition-transform duration-200 ${
        isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-500'
      } ${isCollapsed ? 'mr-0' : ''}`} />
      {!isCollapsed && (
        <>
          <span className="truncate">{item.name}</span>
          {isActive && (
            <ChevronRightIcon className="ml-auto h-4 w-4 text-white animate-pulse" />
          )}
        </>
      )}
    </Link>
  );
};

/**
 * Notification Badge Component
 */
const NotificationBadge = ({ count = 0 }) => {
  if (count === 0) return null;
  
  return (
    <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
      {count > 9 ? '9+' : count}
    </span>
  );
};

/**
 * Quick Action Button Component
 */
const QuickActionButton = ({ icon: Icon, label, onClick, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    orange: 'bg-orange-600 hover:bg-orange-700'
  };

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg text-white ${colorClasses[color]} hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-xl`}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
};

/**
 * Main Layout component for CurlMap Admin Dashboard
 * Includes sidebar navigation and top header with futuristic design
 */
const Layout = ({ isDarkMode, toggleTheme }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [notifications] = useState(3); // Mock notification count
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Users', href: '/users', icon: UsersIcon },
    { name: 'Stylists', href: '/stylists', icon: ScissorsIcon },
    { name: 'Bookings', href: '/bookings', icon: CalendarDaysIcon },
    { name: 'Payments', href: '/payments', icon: CreditCardIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const currentPageName = navigation.find(item => item.href === location.pathname)?.name || 'Dashboard';

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black/50"></div>
        </div>
      )}

      {/* Enhanced Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 glass backdrop-blur-xl border-r border-white/20 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } ${sidebarCollapsed ? 'w-20' : 'w-72'}`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ScissorsIcon className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  CurlMap
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">Admin Portal</div>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="lg:flex hidden p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-white/50 transition-all duration-200"
                title="Collapse sidebar"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavigationItem
                key={item.name}
                item={item}
                isActive={isActive}
                isCollapsed={sidebarCollapsed}
                onClick={() => setSidebarOpen(false)}
              />
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          {/* User Profile Section */}
          <div className={`flex items-center space-x-3 mb-4 p-3 rounded-xl bg-white/5 dark:bg-black/20 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            {!sidebarCollapsed ? (
              <>
                <div className="flex-shrink-0 relative">
                  <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm font-bold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'admin@curlmap.com'}
                  </p>
                </div>
              </>
            ) : (
              <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className={`h-5 w-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
            {!sidebarCollapsed && 'Logout'}
          </button>

          {/* Expand Button (when collapsed) */}
          {sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="w-full mt-2 p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-white/50 transition-all duration-200"
              title="Expand sidebar"
            >
              <Bars3Icon className="h-5 w-5 mx-auto" />
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Top Header */}
        <header className="glass backdrop-blur-xl border-b border-white/20 shadow-lg">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-white/50 transition-all duration-200"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentPageName}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage your hair salon business
                  </p>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Search Button */}
              <button
                className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-white/50 transition-all duration-200 relative"
                title="Search"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>

              {/* Command Palette */}
              <button
                className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-white/50 transition-all duration-200"
                title="Command Palette (Ctrl+K)"
              >
                <CommandLineIcon className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <button
                className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-white/50 transition-all duration-200 relative"
                title="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                <NotificationBadge count={notifications} />
              </button>

              {/* Quick Actions Toggle */}
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-white/50 transition-all duration-200"
                title="Quick Actions"
              >
                <SparklesIcon className="h-5 w-5" />
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-white/50 transition-all duration-200"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3 pl-4 border-l border-white/20">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name?.split(' ')[0] || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Online
                  </p>
                </div>
                <div className="relative">
                  <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          {showQuickActions && (
            <div className="border-t border-white/10 px-6 py-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Actions:</span>
                  <div className="flex space-x-2">
                    <QuickActionButton
                      icon={UsersIcon}
                      label="Add User"
                      color="indigo"
                      onClick={() => navigate('/users')}
                    />
                    <QuickActionButton
                      icon={CalendarDaysIcon}
                      label="New Booking"
                      color="green"
                      onClick={() => navigate('/bookings')}
                    />
                    <QuickActionButton
                      icon={ScissorsIcon}
                      label="Add Stylist"
                      color="purple"
                      onClick={() => navigate('/stylists')}
                    />
                    <QuickActionButton
                      icon={EyeIcon}
                      label="View Analytics"
                      color="orange"
                      onClick={() => navigate('/analytics')}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowQuickActions(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Page content with enhanced styling */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;