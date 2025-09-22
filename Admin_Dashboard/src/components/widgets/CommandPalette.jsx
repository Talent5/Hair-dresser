import React, { useState, useEffect, useRef } from 'react';
import {
  MagnifyingGlassIcon,
  CommandLineIcon,
  HomeIcon,
  UsersIcon,
  ScissorsIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

/**
 * Command Palette Hook
 */
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+K or Cmd+K to open command palette
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    // Navigation Commands
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      description: 'Main dashboard overview',
      icon: HomeIcon,
      category: 'Navigation',
      action: () => {
        navigate('/dashboard');
        setIsOpen(false);
      },
      keywords: ['dashboard', 'home', 'overview']
    },
    {
      id: 'nav-users',
      title: 'Go to Users',
      description: 'Manage customers',
      icon: UsersIcon,
      category: 'Navigation',
      action: () => {
        navigate('/users');
        setIsOpen(false);
      },
      keywords: ['users', 'customers', 'clients']
    },
    {
      id: 'nav-stylists',
      title: 'Go to Stylists',
      description: 'Manage hair stylists',
      icon: ScissorsIcon,
      category: 'Navigation',
      action: () => {
        navigate('/stylists');
        setIsOpen(false);
      },
      keywords: ['stylists', 'hairdressers', 'professionals']
    },
    {
      id: 'nav-bookings',
      title: 'Go to Bookings',
      description: 'View appointments',
      icon: CalendarDaysIcon,
      category: 'Navigation',
      action: () => {
        navigate('/bookings');
        setIsOpen(false);
      },
      keywords: ['bookings', 'appointments', 'schedule']
    },
    {
      id: 'nav-payments',
      title: 'Go to Payments',
      description: 'Financial transactions',
      icon: CreditCardIcon,
      category: 'Navigation',
      action: () => {
        navigate('/payments');
        setIsOpen(false);
      },
      keywords: ['payments', 'transactions', 'money', 'finance']
    },
    {
      id: 'nav-analytics',
      title: 'Go to Analytics',
      description: 'Data insights and reports',
      icon: ChartBarIcon,
      category: 'Navigation',
      action: () => {
        navigate('/analytics');
        setIsOpen(false);
      },
      keywords: ['analytics', 'reports', 'data', 'insights', 'charts']
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      description: 'Application settings',
      icon: Cog6ToothIcon,
      category: 'Navigation',
      action: () => {
        navigate('/settings');
        setIsOpen(false);
      },
      keywords: ['settings', 'preferences', 'configuration']
    },

    // Action Commands
    {
      id: 'action-add-user',
      title: 'Add New Customer',
      description: 'Register a new customer',
      icon: PlusIcon,
      category: 'Actions',
      action: () => {
        console.log('Add new customer');
        setIsOpen(false);
      },
      keywords: ['add', 'new', 'customer', 'user', 'register']
    },
    {
      id: 'action-add-stylist',
      title: 'Add New Stylist',
      description: 'Register a new stylist',
      icon: PlusIcon,
      category: 'Actions',
      action: () => {
        console.log('Add new stylist');
        setIsOpen(false);
      },
      keywords: ['add', 'new', 'stylist', 'hairdresser', 'register']
    },
    {
      id: 'action-new-booking',
      title: 'Create New Booking',
      description: 'Schedule a new appointment',
      icon: CalendarDaysIcon,
      category: 'Actions',
      action: () => {
        console.log('Create new booking');
        setIsOpen(false);
      },
      keywords: ['new', 'booking', 'appointment', 'schedule', 'create']
    },
    {
      id: 'action-view-reports',
      title: 'Generate Report',
      description: 'Create analytics report',
      icon: DocumentTextIcon,
      category: 'Actions',
      action: () => {
        console.log('Generate report');
        setIsOpen(false);
      },
      keywords: ['report', 'generate', 'analytics', 'export']
    },

    // Quick View Commands
    {
      id: 'view-today-bookings',
      title: "Today's Bookings",
      description: 'View appointments for today',
      icon: EyeIcon,
      category: 'Quick View',
      action: () => {
        console.log('View today bookings');
        setIsOpen(false);
      },
      keywords: ['today', 'bookings', 'appointments', 'schedule']
    },
    {
      id: 'view-revenue',
      title: 'Revenue Summary',
      description: 'Quick revenue overview',
      icon: ChartBarIcon,
      category: 'Quick View',
      action: () => {
        console.log('View revenue summary');
        setIsOpen(false);
      },
      keywords: ['revenue', 'summary', 'money', 'earnings']
    }
  ];

  return {
    isOpen,
    setIsOpen,
    commands
  };
};

/**
 * Command Item Component
 */
const CommandItem = ({ command, isSelected, onClick }) => {
  const IconComponent = command.icon;

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-150
        ${isSelected 
          ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100' 
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
        }
      `}
    >
      <div className={`
        p-2 rounded-lg
        ${isSelected 
          ? 'bg-indigo-200 dark:bg-indigo-800' 
          : 'bg-gray-100 dark:bg-slate-600'
        }
      `}>
        <IconComponent className="h-4 w-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium truncate">
            {command.title}
          </p>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {command.category}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {command.description}
        </p>
      </div>
      
      {isSelected && (
        <ArrowRightIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
      )}
    </button>
  );
};

/**
 * Command Palette Component
 */
const CommandPalette = () => {
  const { isOpen, setIsOpen, commands } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Filter commands based on query
  const filteredCommands = commands.filter(command => {
    if (!query) return true;
    
    const searchQuery = query.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchQuery) ||
      command.description.toLowerCase().includes(searchQuery) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery))
    );
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const category = command.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(command);
    return groups;
  }, {});

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Command Palette */}
      <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
        <div className="mx-auto max-w-2xl transform divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all animate-scale-in">
          
          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
              placeholder="Search commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute right-4 top-3">
              <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-xs font-sans text-gray-400">
                ESC
              </kbd>
            </div>
          </div>

          {/* Results */}
          {filteredCommands.length > 0 ? (
            <div className="max-h-96 scroll-py-2 overflow-y-auto py-2">
              {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {category}
                  </h3>
                  <div className="px-2 space-y-1">
                    {categoryCommands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      return (
                        <CommandItem
                          key={command.id}
                          command={command}
                          isSelected={globalIndex === selectedIndex}
                          onClick={() => command.action()}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center sm:px-14">
              <CommandLineIcon className="mx-auto h-6 w-6 text-gray-400" />
              <p className="mt-4 text-sm text-gray-900 dark:text-white">
                No commands found for "{query}"
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Try searching for navigation, actions, or quick views
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-wrap items-center bg-gray-50 dark:bg-slate-700 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300">
            <span className="mr-4">Navigate with</span>
            <div className="flex space-x-1">
              <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 font-mono text-xs">
                ↑↓
              </kbd>
              <span className="mr-4">arrows</span>
              <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 font-mono text-xs">
                ↵
              </kbd>
              <span>to select</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;