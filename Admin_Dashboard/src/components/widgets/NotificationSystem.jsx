import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline';

/**
 * Notification Types
 */
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Individual Notification Component
 */
const NotificationItem = ({ notification, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);

  const typeConfig = {
    success: {
      icon: CheckCircleIcon,
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-700',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      titleColor: 'text-emerald-800 dark:text-emerald-200',
      textColor: 'text-emerald-700 dark:text-emerald-300'
    },
    error: {
      icon: XCircleIcon,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-700',
      iconColor: 'text-red-600 dark:text-red-400',
      titleColor: 'text-red-800 dark:text-red-200',
      textColor: 'text-red-700 dark:text-red-300'
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-700',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      titleColor: 'text-yellow-800 dark:text-yellow-200',
      textColor: 'text-yellow-700 dark:text-yellow-300'
    },
    info: {
      icon: InformationCircleIcon,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      iconColor: 'text-blue-600 dark:text-blue-400',
      titleColor: 'text-blue-800 dark:text-blue-200',
      textColor: 'text-blue-700 dark:text-blue-300'
    }
  };

  const config = typeConfig[notification.type] || typeConfig.info;
  const IconComponent = config.icon;

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  useEffect(() => {
    if (notification.autoHide) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div
      className={`
        notification-item pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl shadow-lg ring-1 ring-black ring-opacity-5
        ${config.bgColor} ${config.borderColor} border
        ${isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
        transform transition-all duration-300 hover:scale-105
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-semibold ${config.titleColor}`}>
              {notification.title}
            </p>
            <p className={`mt-1 text-sm ${config.textColor}`}>
              {notification.message}
            </p>
            {notification.action && (
              <div className="mt-3">
                <button
                  onClick={notification.action.onClick}
                  className={`
                    text-xs font-medium px-3 py-2 rounded-md
                    ${config.iconColor} hover:opacity-80 transition-opacity
                    bg-white dark:bg-slate-800 border border-current
                  `}
                >
                  {notification.action.label}
                </button>
              </div>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleDismiss}
              className={`
                rounded-md inline-flex ${config.textColor} hover:opacity-70 transition-opacity
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              `}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar for auto-hide notifications */}
      {notification.autoHide && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10">
          <div 
            className={`h-full ${config.iconColor.replace('text-', 'bg-')} opacity-50`}
            style={{
              animation: `progress ${notification.duration || 5000}ms linear`
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Notification Container Component
 */
const NotificationContainer = ({ notifications, onDismiss }) => {
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Notification Hook for Managing Notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = ({
    title,
    message,
    type = NOTIFICATION_TYPES.INFO,
    autoHide = true,
    duration = 5000,
    action = null
  }) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      title,
      message,
      type,
      autoHide,
      duration,
      action,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, notification]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Convenience methods
  const success = (title, message, options = {}) => 
    addNotification({ title, message, type: NOTIFICATION_TYPES.SUCCESS, ...options });

  const error = (title, message, options = {}) => 
    addNotification({ title, message, type: NOTIFICATION_TYPES.ERROR, autoHide: false, ...options });

  const warning = (title, message, options = {}) => 
    addNotification({ title, message, type: NOTIFICATION_TYPES.WARNING, ...options });

  const info = (title, message, options = {}) => 
    addNotification({ title, message, type: NOTIFICATION_TYPES.INFO, ...options });

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  };
};

/**
 * Notification Bell Component for Header
 */
export const NotificationBell = ({ count = 0, onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (count > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  return (
    <button
      onClick={onClick}
      className={`
        relative p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-white/50 
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500
        ${isAnimating ? 'animate-bounce' : ''}
      `}
      title="Notifications"
    >
      <BellIcon className="h-5 w-5" />
      {count > 0 && (
        <span className={`
          absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold 
          rounded-full flex items-center justify-center
          ${isAnimating ? 'animate-pulse' : ''}
        `}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
};

/**
 * Main Notification System Component
 */
const NotificationSystem = () => {
  const { notifications, removeNotification } = useNotifications();

  return <NotificationContainer notifications={notifications} onDismiss={removeNotification} />;
};

export default NotificationSystem;
export { NOTIFICATION_TYPES };

// Additional CSS for animations (add to App.css)
const additionalStyles = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out-right {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}

.animate-slide-out-right {
  animation: slide-out-right 0.3s ease-in;
}
`;