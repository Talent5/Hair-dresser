import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  ScissorsIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MapPinIcon,
  StarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  SparklesIcon,
  FireIcon,
  LightBulbIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { apiService } from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
);

/**
 * Animated Counter Component
 */
const AnimatedCounter = ({ value, duration = 2000, formatter = (val) => val.toLocaleString() }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    const startValue = 0;
    const endValue = value;

    const updateCounter = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      setDisplayValue(Math.floor(currentValue));
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    if (value > 0) {
      requestAnimationFrame(updateCounter);
    }
  }, [value, duration]);

  return <span>{formatter(displayValue)}</span>;
};

/**
 * Advanced Metric Card Component
 */
const MetricCard = ({ title, value, change, icon: Icon, color, trend, sparklineData, subtitle }) => {
  const isPositive = change > 0;
  const TrendIcon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

  const sparklineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      point: { radius: 0 },
      line: { tension: 0.4 }
    }
  };

  const sparklineChartData = sparklineData ? {
    labels: Array.from({ length: sparklineData.length }, (_, i) => i),
    datasets: [{
      data: sparklineData,
      borderColor: color,
      backgroundColor: `${color}20`,
      fill: true,
      borderWidth: 2
    }]
  } : null;

  return (
    <div className="card-modern hover-lift glow-hover bg-white dark:bg-slate-800 p-6 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${color === '#6366f1' ? 'from-indigo-500 to-purple-600' :
              color === '#10b981' ? 'from-emerald-500 to-teal-600' :
              color === '#f59e0b' ? 'from-amber-500 to-orange-600' :
              'from-rose-500 to-pink-600'} shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
              {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              <AnimatedCounter value={value} />
            </p>
            {change !== undefined && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                isPositive 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                <TrendIcon className="h-3 w-3" />
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>

          {trend && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{trend}</p>
          )}
        </div>

        {/* Mini Sparkline Chart */}
        {sparklineChartData && (
          <div className="w-20 h-12 ml-4">
            <Line data={sparklineChartData} options={sparklineOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Activity Feed Component
 */
const ActivityFeed = ({ activities }) => {
  return (
    <div className="card-modern p-6 bg-white dark:bg-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <BellIcon className="h-5 w-5 mr-2 text-indigo-600" />
          Recent Activity
        </h3>
        <span className="status-dot status-online"></span>
      </div>
      
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
            <div className={`p-2 rounded-full ${activity.type === 'booking' ? 'bg-blue-100 text-blue-600' :
              activity.type === 'payment' ? 'bg-green-100 text-green-600' :
              activity.type === 'user' ? 'bg-purple-100 text-purple-600' :
              'bg-orange-100 text-orange-600'
            }`}>
              {activity.type === 'booking' && <CalendarDaysIcon className="h-4 w-4" />}
              {activity.type === 'payment' && <CurrencyDollarIcon className="h-4 w-4" />}
              {activity.type === 'user' && <UserGroupIcon className="h-4 w-4" />}
              {activity.type === 'stylist' && <ScissorsIcon className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {activity.message}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activity.time} • {activity.location}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Performance Insights Component
 */
const PerformanceInsights = ({ insights }) => {
  return (
    <div className="card-modern p-6 bg-white dark:bg-slate-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <LightBulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
          AI Insights
        </h3>
        <SparklesIcon className="h-5 w-5 text-yellow-500 animate-pulse-glow" />
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className={`p-4 rounded-lg border-l-4 ${
            insight.type === 'positive' ? 'bg-green-50 border-green-400 dark:bg-green-900/20' :
            insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20' :
            'bg-blue-50 border-blue-400 dark:bg-blue-900/20'
          }`}>
            <div className="flex items-start space-x-3">
              {insight.type === 'positive' && <ArrowTrendingUpIcon className="h-5 w-5 text-green-600 mt-0.5" />}
              {insight.type === 'warning' && <FireIcon className="h-5 w-5 text-yellow-600 mt-0.5" />}
              {insight.type === 'info' && <EyeIcon className="h-5 w-5 text-blue-600 mt-0.5" />}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {insight.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main Dashboard Page for CurlMap Admin Panel
 * Provides platform overview with key metrics and charts
 */
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStylists: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeBookings: 0,
    pendingApprovals: 0,
    monthlyGrowth: 0,
    customerSatisfaction: 0
  });
  
  const [trends, setTrends] = useState({
    users: { value: 0, change: 0 },
    bookings: { value: 0, change: 0 },
    revenue: { value: 0, change: 0 },
    satisfaction: { value: 0, change: 0 }
  });
  
  const [chartData, setChartData] = useState(null);
  const [revenueChart, setRevenueChart] = useState(null);
  const [serviceDistribution, setServiceDistribution] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingStylists, setPendingStylists] = useState([]);
  const [activities, setActivities] = useState([]);
  const [insights, setInsights] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call with enhanced mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set enhanced overview stats
      setStats({
        totalUsers: 2847,
        totalStylists: 156,
        totalBookings: 1432,
        totalRevenue: 284750,
        activeBookings: 47,
        pendingApprovals: 8,
        monthlyGrowth: 23.5,
        customerSatisfaction: 4.8
      });

      // Set trends with sparkline data
      setTrends({
        users: { value: 2847, change: 15.2, sparkline: [120, 135, 145, 142, 158, 165, 172] },
        bookings: { value: 1432, change: 8.7, sparkline: [45, 52, 48, 61, 55, 67, 72] },
        revenue: { value: 284750, change: 12.3, sparkline: [15000, 18000, 16500, 22000, 19500, 25000, 28000] },
        satisfaction: { value: 4.8, change: 2.1, sparkline: [4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8] }
      });

      // Enhanced bookings chart
      const bookingsLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const bookingsData = [85, 120, 145, 178, 165, 189, 203, 225, 198, 245, 267, 289];
      
      setChartData({
        labels: bookingsLabels,
        datasets: [
          {
            label: 'Bookings',
            data: bookingsData,
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgb(99, 102, 241)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
          }
        ]
      });

      // Revenue chart data
      setRevenueChart({
        labels: bookingsLabels,
        datasets: [
          {
            label: 'Revenue ($)',
            data: [12500, 18000, 22300, 19800, 26500, 31200, 28900, 35600, 32100, 38900, 42300, 45600],
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      });

      // Service distribution data
      setServiceDistribution({
        labels: ['Hair Braiding', 'Relaxers', 'Natural Hair Care', 'Extensions', 'Styling', 'Color'],
        datasets: [
          {
            data: [35, 25, 20, 15, 15, 10],
            backgroundColor: [
              'rgba(99, 102, 241, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(236, 72, 153, 0.8)'
            ],
            borderWidth: 0
          }
        ]
      });

      // Mock recent activities
      setActivities([
        { type: 'booking', message: 'New booking from Sarah Johnson', time: '2 minutes ago', location: 'Harare' },
        { type: 'payment', message: 'Payment received: $85.00', time: '5 minutes ago', location: 'Online' },
        { type: 'user', message: 'Grace Mukamuri joined the platform', time: '12 minutes ago', location: 'Bulawayo' },
        { type: 'stylist', message: 'New stylist application submitted', time: '1 hour ago', location: 'Gweru' },
        { type: 'booking', message: 'Booking completed successfully', time: '2 hours ago', location: 'Harare' }
      ]);

      // AI-powered insights
      setInsights([
        {
          type: 'positive',
          title: 'Revenue Growth Acceleration',
          description: 'Monthly revenue increased by 23% - highest growth this quarter'
        },
        {
          type: 'warning',
          title: 'Peak Hour Congestion',
          description: 'Saturday 2-4 PM shows 85% booking saturation. Consider promoting off-peak slots'
        },
        {
          type: 'info',
          title: 'Service Trend Analysis',
          description: 'Natural hair care services up 40% this month - trending service category'
        }
      ]);

      // Enhanced recent bookings
      setRecentBookings([
        { 
          id: 1, 
          customer: 'Sarah Johnson', 
          stylist: 'Maya Stevens', 
          service: 'Knotless Braids', 
          status: 'confirmed', 
          date: '2025-01-15',
          amount: 120,
          rating: 5
        },
        { 
          id: 2, 
          customer: 'Grace Mukamuri', 
          stylist: 'Tanya Chipo', 
          service: 'Silk Press', 
          status: 'pending', 
          date: '2025-01-16',
          amount: 85,
          rating: null
        },
        { 
          id: 3, 
          customer: 'Faith Mapfumo', 
          stylist: 'Lisa Sibanda', 
          service: 'Twist Out', 
          status: 'completed', 
          date: '2025-01-14',
          amount: 65,
          rating: 4.8
        }
      ]);

      setPendingStylists([
        { 
          id: 1, 
          name: 'Angela Mhandu', 
          email: 'angela@email.com', 
          experience: '3 years', 
          joinDate: '2025-01-10',
          specialties: ['Braids', 'Natural Hair'],
          rating: 4.7
        },
        { 
          id: 2, 
          name: 'Chipo Mandaza', 
          email: 'chipo@email.com', 
          experience: '5 years', 
          joinDate: '2025-01-12',
          specialties: ['Relaxers', 'Color'],
          rating: 4.9
        }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZW', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' }
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: '#64748b' }
      }
    },
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(16, 185, 129, 0.5)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' }
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { 
          color: '#64748b',
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          color: '#64748b',
          font: { size: 12 }
        }
      }
    },
    cutout: '60%'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Page Header with Enhanced Styling */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                Welcome to CurlMap Dashboard
              </h1>
              <p className="mt-2 text-indigo-100 text-lg">
                Your comprehensive hair salon management platform
              </p>
              <div className="mt-4 flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="status-dot status-online mr-2"></div>
                  <span>System Operational</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-6 lg:mt-0 lg:ml-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold">$<AnimatedCounter value={stats.totalRevenue} duration={1500} /></div>
                  <div className="text-sm text-indigo-100">Total Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-20">
          <SparklesIcon className="h-32 w-32 text-white animate-float" />
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          subtitle="Active customers"
          value={stats.totalUsers}
          change={trends.users.change}
          icon={UsersIcon}
          color="#6366f1"
          trend="vs last month"
          sparklineData={trends.users.sparkline}
        />
        <MetricCard
          title="Hair Stylists"
          subtitle="Verified professionals"
          value={stats.totalStylists}
          change={8.2}
          icon={ScissorsIcon}
          color="#10b981"
          trend="vs last month"
          sparklineData={[20, 25, 22, 28, 26, 30, 32]}
        />
        <MetricCard
          title="Total Bookings"
          subtitle="All time"
          value={stats.totalBookings}
          change={trends.bookings.change}
          icon={CalendarDaysIcon}
          color="#f59e0b"
          trend="vs last month"
          sparklineData={trends.bookings.sparkline}
        />
        <MetricCard
          title="Revenue"
          subtitle="This month"
          value={stats.totalRevenue}
          change={trends.revenue.change}
          icon={BanknotesIcon}
          color="#ef4444"
          trend="vs last month"
          sparklineData={trends.revenue.sparkline}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Bookings"
          subtitle="In progress"
          value={stats.activeBookings}
          icon={ClockIcon}
          color="#8b5cf6"
          trend="Real-time"
        />
        <MetricCard
          title="Pending Approvals"
          subtitle="Stylist applications"
          value={stats.pendingApprovals}
          icon={ChartBarIcon}
          color="#f97316"
          trend="Requires attention"
        />
        <MetricCard
          title="Monthly Growth"
          subtitle="Customer acquisition"
          value={stats.monthlyGrowth}
          change={5.2}
          icon={ArrowTrendingUpIcon}
          color="#06b6d4"
          trend="vs last month"
        />
        <MetricCard
          title="Satisfaction"
          subtitle="Average rating"
          value={stats.customerSatisfaction}
          change={trends.satisfaction.change}
          icon={StarIcon}
          color="#ec4899"
          trend="vs last month"
          sparklineData={trends.satisfaction.sparkline}
        />
      </div>

      {/* Charts and Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bookings Chart */}
        <div className="lg:col-span-2 card-modern p-6 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-600" />
              Bookings Trend Analysis
            </h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors">
                12M
              </button>
              <button className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
                6M
              </button>
              <button className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
                3M
              </button>
            </div>
          </div>
          {chartData && (
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Service Distribution Chart */}
        <div className="card-modern p-6 bg-white dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FireIcon className="h-5 w-5 mr-2 text-orange-500" />
            Popular Services
          </h3>
          {serviceDistribution && (
            <div className="h-64">
              <Doughnut data={serviceDistribution} options={doughnutOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="card-modern p-6 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
            Monthly Revenue Performance
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total: <span className="font-semibold text-green-600">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
        {revenueChart && (
          <div className="h-64">
            <Bar data={revenueChart} options={barChartOptions} />
          </div>
        )}
      </div>

      {/* Activity Feed and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={activities} />
        <PerformanceInsights insights={insights} />
      </div>

      {/* Recent Bookings and Pending Stylists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Recent Bookings */}
        <div className="card-modern p-6 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-600" />
              Recent Bookings
            </h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {booking.customer.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {booking.customer}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {booking.service} with {booking.stylist}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(booking.amount)}
                      </span>
                      {booking.rating && (
                        <div className="flex items-center">
                          <StarIcon className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            {booking.rating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {getStatusBadge(booking.status)}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(booking.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Pending Stylists */}
        <div className="card-modern p-6 bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ScissorsIcon className="h-5 w-5 mr-2 text-purple-600" />
              Pending Stylist Applications
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-red-900 dark:text-red-200">
              {pendingStylists.length} pending
            </span>
          </div>
          <div className="space-y-4">
            {pendingStylists.map((stylist) => (
              <div key={stylist.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {stylist.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {stylist.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {stylist.email}
                      </p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {stylist.experience} experience
                        </span>
                        <div className="flex items-center">
                          <StarIcon className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            {stylist.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {stylist.specialties.map((specialty, index) => (
                          <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full dark:bg-indigo-900 dark:text-indigo-200">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="btn-futuristic text-xs px-3 py-1 bg-green-600 hover:bg-green-700">
                      Approve
                    </button>
                    <button className="text-xs px-3 py-1 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 dark:bg-slate-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-slate-600 transition-colors">
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;