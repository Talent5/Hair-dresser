import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChartBarIcon,
  UsersIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon
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
 * Analytics & Reports Page
 * Platform insights and business intelligence
 */
const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [serviceStats, setServiceStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const [
        analyticsResponse,
        trendsResponse,
        servicesResponse
      ] = await Promise.all([
        apiService.getAnalytics(),
        apiService.getTrends('12'),
        apiService.getServiceStats()
      ]);

      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.data);
      }

      if (trendsResponse.success) {
        setTrends(trendsResponse.data);
      }

      if (servicesResponse.success) {
        setServiceStats(servicesResponse.data);
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZW', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getChangeColor = (change) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change) => {
    return change >= 0 ? TrendingUpIcon : TrendingDownIcon;
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'bottom'
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

  // Prepare chart data
  const userGrowthData = trends ? {
    labels: trends.users?.map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - index));
      return date.toLocaleDateString('en-US', { month: 'short' });
    }) || [],
    datasets: [
      {
        label: 'New Users',
        data: trends.users?.map(u => u.count) || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  } : null;

  const revenueGrowthData = trends ? {
    labels: trends.revenue?.map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - index));
      return date.toLocaleDateString('en-US', { month: 'short' });
    }) || [],
    datasets: [
      {
        label: 'Revenue ($)',
        data: trends.revenue?.map(r => r.revenue) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2
      }
    ]
  } : null;

  const serviceDistributionData = serviceStats ? {
    labels: serviceStats.map(s => s._id || 'Unknown Service'),
    datasets: [
      {
        data: serviceStats.map(s => s.count),
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
  } : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Analytics & Reports
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Platform insights and business intelligence
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {analytics.totalUsers || 0}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${getChangeColor(analytics.growth?.users || 0)}`}>
                        {React.createElement(getChangeIcon(analytics.growth?.users || 0), { className: 'h-4 w-4 mr-1' })}
                        {Math.abs(analytics.growth?.users || 0).toFixed(1)}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarDaysIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {analytics.totalBookings || 0}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${getChangeColor(analytics.growth?.bookings || 0)}`}>
                        {React.createElement(getChangeIcon(analytics.growth?.bookings || 0), { className: 'h-4 w-4 mr-1' })}
                        {Math.abs(analytics.growth?.bookings || 0).toFixed(1)}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BanknotesIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(analytics.totalRevenue || 0)}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${getChangeColor(analytics.growth?.revenue || 0)}`}>
                        {React.createElement(getChangeIcon(analytics.growth?.revenue || 0), { className: 'h-4 w-4 mr-1' })}
                        {Math.abs(analytics.growth?.revenue || 0).toFixed(1)}%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="h-6 w-6 text-pink-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Avg Rating</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {(analytics.averageRating || 0).toFixed(1)}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-gray-500">
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">User Growth</h3>
            <UsersIcon className="h-5 w-5 text-indigo-500" />
          </div>
          {userGrowthData && (
            <div className="h-64">
              <Line data={userGrowthData} options={chartOptions} />
            </div>
          )}
        </div>

        {/* Revenue Growth Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Revenue Growth</h3>
            <BanknotesIcon className="h-5 w-5 text-green-500" />
          </div>
          {revenueGrowthData && (
            <div className="h-64">
              <Bar data={revenueGrowthData} options={chartOptions} />
            </div>
          )}
        </div>
      </div>

      {/* Service Analytics and Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Service Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Service Distribution</h3>
            <ChartBarIcon className="h-5 w-5 text-purple-500" />
          </div>
          {serviceDistributionData && (
            <div className="h-64">
              <Doughnut data={serviceDistributionData} options={doughnutOptions} />
            </div>
          )}
        </div>

        {/* Top Services */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Top Performing Services</h3>
            <TrendingUpIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-4">
            {serviceStats?.slice(0, 5).map((service, index) => (
              <div key={service._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-400' :
                    'bg-indigo-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{service._id || 'Unknown Service'}</p>
                    <p className="text-sm text-gray-500">{service.count} bookings</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(service.totalRevenue || 0)}</p>
                  {service.avgRating && (
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-500 ml-1">{service.avgRating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ClockIcon className="h-6 w-6 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-900">Active Bookings</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">{analytics.activeBookings || 0}</div>
            <p className="text-sm text-gray-500 mt-1">Currently in progress</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <UsersIcon className="h-6 w-6 text-purple-500" />
              <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">{analytics.pendingApprovals || 0}</div>
            <p className="text-sm text-gray-500 mt-1">Stylist applications</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              <h3 className="text-lg font-medium text-gray-900">Completed Bookings</h3>
            </div>
            <div className="text-3xl font-bold text-gray-900">{analytics.completedBookings || 0}</div>
            <p className="text-sm text-gray-500 mt-1">All time total</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;