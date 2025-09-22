import React, { useState } from 'react';
import {
  PlusIcon,
  UserPlusIcon,
  CalendarPlusIcon,
  ScissorsIcon,
  ChartBarIcon,
  CogIcon,
  RocketLaunchIcon,
  SparklesIcon,
  LightBulbIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

/**
 * Quick Action Button Component
 */
const QuickActionButton = ({ 
  icon: Icon, 
  label, 
  description, 
  onClick, 
  color = 'indigo',
  size = 'medium',
  disabled = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    indigo: 'from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700',
    green: 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700',
    orange: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
    red: 'from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700',
    blue: 'from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700',
    purple: 'from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
  };

  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6'
  };

  const iconSizes = {
    small: 'h-5 w-5',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative group ${sizeClasses[size]} rounded-xl text-white font-semibold
        bg-gradient-to-r ${colorClasses[color]}
        transform transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-2xl
        focus:outline-none focus:ring-4 focus:ring-indigo-500/50
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${isHovered ? 'shadow-2xl' : 'shadow-lg'}
      `}
    >
      {/* Background glow effect */}
      <div className={`
        absolute inset-0 rounded-xl bg-gradient-to-r ${colorClasses[color]} opacity-75 blur-md
        transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}
      `} />
      
      {/* Content */}
      <div className="relative flex items-center space-x-3">
        <div className={`
          ${sizeClasses[size]} rounded-lg bg-white/20 backdrop-blur-sm
          transform transition-transform duration-300
          ${isHovered ? 'scale-110 rotate-12' : ''}
        `}>
          <Icon className={`${iconSizes[size]} text-white`} />
        </div>
        
        {(label || description) && (
          <div className="text-left">
            {label && (
              <div className={`font-semibold ${size === 'small' ? 'text-sm' : 'text-base'}`}>
                {label}
              </div>
            )}
            {description && (
              <div className={`text-white/80 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
                {description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shine effect */}
      <div className={`
        absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/25 to-transparent
        transform -skew-x-12 transition-transform duration-1000
        ${isHovered ? 'translate-x-full' : '-translate-x-full'}
      `} />
    </button>
  );
};

/**
 * Quick Actions Grid Component
 */
const QuickActionsGrid = ({ actions, columns = 2 }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${columns} gap-4`}>
      {actions.map((action, index) => (
        <QuickActionButton key={index} {...action} />
      ))}
    </div>
  );
};

/**
 * Quick Actions Widget Component
 */
const QuickActionsWidget = ({ title = "Quick Actions", onActionClick }) => {
  const [selectedCategory, setSelectedCategory] = useState('common');

  const actionCategories = {
    common: {
      label: 'Common',
      icon: RocketLaunchIcon,
      actions: [
        {
          icon: UserPlusIcon,
          label: 'Add Customer',
          description: 'Register new customer',
          color: 'indigo',
          onClick: () => onActionClick('add-customer')
        },
        {
          icon: CalendarPlusIcon,
          label: 'New Booking',
          description: 'Schedule appointment',
          color: 'green',
          onClick: () => onActionClick('new-booking')
        },
        {
          icon: ScissorsIcon,
          label: 'Add Stylist',
          description: 'Register new stylist',
          color: 'purple',
          onClick: () => onActionClick('add-stylist')
        },
        {
          icon: ChartBarIcon,
          label: 'View Reports',
          description: 'Analytics dashboard',
          color: 'orange',
          onClick: () => onActionClick('view-reports')
        }
      ]
    },
    management: {
      label: 'Management',
      icon: CogIcon,
      actions: [
        {
          icon: BoltIcon,
          label: 'System Status',
          description: 'Check health',
          color: 'blue',
          onClick: () => onActionClick('system-status')
        },
        {
          icon: CogIcon,
          label: 'Settings',
          description: 'App configuration',
          color: 'red',
          onClick: () => onActionClick('settings')
        },
        {
          icon: LightBulbIcon,
          label: 'AI Insights',
          description: 'Smart recommendations',
          color: 'indigo',
          onClick: () => onActionClick('ai-insights')
        },
        {
          icon: SparklesIcon,
          label: 'Optimize',
          description: 'Performance boost',
          color: 'green',
          onClick: () => onActionClick('optimize')
        }
      ]
    }
  };

  return (
    <div className="card-modern p-6 bg-white dark:bg-slate-800 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600">
            <RocketLaunchIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        {/* Category Tabs */}
        <div className="flex space-x-2">
          {Object.entries(actionCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200
                ${selectedCategory === key
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions Grid */}
      <QuickActionsGrid 
        actions={actionCategories[selectedCategory].actions}
        columns={2}
      />

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Press Ctrl+K for command palette</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Floating Action Button Component
 */
export const FloatingActionButton = ({ icon: Icon, onClick, color = 'indigo' }) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    indigo: 'from-indigo-500 to-purple-600',
    green: 'from-emerald-500 to-teal-600',
    orange: 'from-amber-500 to-orange-600',
    red: 'from-rose-500 to-pink-600'
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed bottom-8 right-8 z-40 p-4 rounded-full shadow-2xl
        bg-gradient-to-r ${colorClasses[color]}
        transform transition-all duration-300 ease-out
        hover:scale-110 focus:outline-none focus:ring-4 focus:ring-indigo-500/50
        ${isHovered ? 'shadow-3xl rotate-12' : ''}
      `}
    >
      <Icon className="h-6 w-6 text-white" />
      
      {/* Ripple effect */}
      <div className={`
        absolute inset-0 rounded-full bg-white/20
        ${isHovered ? 'animate-ping' : ''}
      `} />
    </button>
  );
};

export default QuickActionsWidget;