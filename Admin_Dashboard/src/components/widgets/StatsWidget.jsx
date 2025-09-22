import React, { useState, useEffect } from 'react';
import { TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/outline';

/**
 * Animated Counter Hook
 */
const useAnimatedCounter = (targetValue, duration = 2000) => {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (targetValue === 0) {
      setCurrentValue(0);
      return;
    }

    let startTime;
    const startValue = 0;
    const endValue = targetValue;

    const updateCounter = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newValue = startValue + (endValue - startValue) * easeOutQuart;
      
      setCurrentValue(Math.floor(newValue));
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [targetValue, duration]);

  return currentValue;
};

/**
 * Stats Widget Component with Enhanced Animations
 */
const StatsWidget = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'indigo',
  format = 'number',
  trend = '',
  sparklineData = null,
  size = 'medium'
}) => {
  const animatedValue = useAnimatedCounter(value);
  const [isHovered, setIsHovered] = useState(false);

  const colorClasses = {
    indigo: {
      gradient: 'from-indigo-500 to-purple-600',
      glow: 'shadow-indigo-500/25',
      text: 'text-indigo-600',
      bg: 'bg-indigo-100 dark:bg-indigo-900'
    },
    green: {
      gradient: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/25',
      text: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900'
    },
    orange: {
      gradient: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/25',
      text: 'text-amber-600',
      bg: 'bg-amber-100 dark:bg-amber-900'
    },
    red: {
      gradient: 'from-rose-500 to-pink-600',
      glow: 'shadow-rose-500/25',
      text: 'text-rose-600',
      bg: 'bg-rose-100 dark:bg-rose-900'
    },
    blue: {
      gradient: 'from-blue-500 to-cyan-600',
      glow: 'shadow-blue-500/25',
      text: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900'
    },
    purple: {
      gradient: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-500/25',
      text: 'text-violet-600',
      bg: 'bg-violet-100 dark:bg-violet-900'
    }
  };

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const formatValue = (val) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val}%`;
      case 'decimal':
        return val.toFixed(1);
      default:
        return val.toLocaleString();
    }
  };

  const currentColor = colorClasses[color] || colorClasses.indigo;
  const isPositive = change >= 0;

  return (
    <div 
      className={`
        card-modern hover-lift bg-white dark:bg-slate-800 
        ${sizeClasses[size]} 
        ${isHovered ? `shadow-2xl ${currentColor.glow}` : 'shadow-lg'}
        transition-all duration-300 cursor-pointer group
        animate-slide-up
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Icon and Title */}
          <div className="flex items-center space-x-3 mb-4">
            <div className={`
              p-3 rounded-xl bg-gradient-to-r ${currentColor.gradient} 
              shadow-lg transform transition-transform duration-300
              ${isHovered ? 'scale-110 rotate-3' : ''}
            `}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {title}
              </p>
              {trend && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {trend}
                </p>
              )}
            </div>
          </div>
          
          {/* Value */}
          <div className="flex items-baseline space-x-2 mb-2">
            <p className={`
              text-3xl font-bold text-gray-900 dark:text-white 
              transform transition-transform duration-300
              ${isHovered ? 'scale-105' : ''}
            `}>
              {formatValue(animatedValue)}
            </p>
            
            {/* Change Indicator */}
            {change !== undefined && change !== null && (
              <div className={`
                flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-semibold
                transform transition-all duration-300
                ${isHovered ? 'scale-110' : ''}
                ${isPositive 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }
              `}>
                {isPositive ? (
                  <TrendingUpIcon className="h-4 w-4" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4" />
                )}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>

          {/* Sparkline or Progress Bar */}
          {sparklineData && (
            <div className="mt-4">
              <div className="flex items-center space-x-1 h-8">
                {sparklineData.map((value, index) => (
                  <div
                    key={index}
                    className={`
                      flex-1 bg-gradient-to-t ${currentColor.gradient} rounded-sm
                      transform transition-all duration-300 delay-${index * 50}
                      ${isHovered ? 'scale-y-110' : ''}
                    `}
                    style={{
                      height: `${(value / Math.max(...sparklineData)) * 100}%`,
                      minHeight: '4px'
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Last 7 days trend
              </p>
            </div>
          )}
        </div>

        {/* Status Indicator */}
        <div className="flex flex-col items-end space-y-2">
          <div className={`
            w-3 h-3 rounded-full 
            ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}
            ${isHovered ? 'animate-pulse' : ''}
          `} />
          
          {/* Additional Info */}
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              vs last period
            </p>
          </div>
        </div>
      </div>

      {/* Hover Effects */}
      <div className={`
        absolute inset-0 bg-gradient-to-r ${currentColor.gradient} opacity-0 rounded-xl
        transition-opacity duration-300 pointer-events-none
        ${isHovered ? 'opacity-5' : ''}
      `} />
    </div>
  );
};

export default StatsWidget;