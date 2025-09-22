import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  FlagIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function AdminRatingsManagement() {
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRating, setSelectedRating] = useState(null);
  const [moderationModalOpen, setModerationModalOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState('approve');
  const [moderationReason, setModerationReason] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API calls
      const mockStats = {
        totalRatings: 1247,
        averageRating: 4.3,
        flaggedRatings: 23,
        pendingModeration: 8,
        ratingsByPeriod: {
          today: 15,
          thisWeek: 89,
          thisMonth: 312
        },
        ratingBreakdown: {
          5: 687,
          4: 298,
          3: 156,
          2: 78,
          1: 28
        }
      };

      const mockRatings = [
        {
          _id: '1',
          overallRating: 5,
          review: { content: 'Amazing service! Highly recommend.' },
          userId: { name: 'Sarah Johnson', avatar: '' },
          stylistId: { userId: { name: 'Emily Chen' } },
          createdAt: new Date(),
          moderationStatus: 'pending',
          isFlagged: false,
          helpfulVotes: 5,
          notHelpfulVotes: 0
        },
        {
          _id: '2',
          overallRating: 2,
          review: { content: 'Service was not good. Late and unprofessional.' },
          userId: { name: 'Mike Wilson', avatar: '' },
          stylistId: { userId: { name: 'Jessica Brown' } },
          createdAt: new Date(),
          moderationStatus: 'pending',
          isFlagged: true,
          helpfulVotes: 1,
          notHelpfulVotes: 3
        }
      ];

      setStats(mockStats);
      setRatings(mockRatings);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async () => {
    if (!selectedRating || !moderationReason.trim()) return;

    try {
      // API call would go here
      console.log(`${moderationAction}ing rating ${selectedRating._id}: ${moderationReason}`);
      
      // Update local state
      setRatings(prev => prev.map(rating => 
        rating._id === selectedRating._id 
          ? { 
              ...rating, 
              moderationStatus: moderationAction === 'approve' ? 'approved' : 'rejected',
              isFlagged: moderationAction === 'flag' ? true : rating.isFlagged
            }
          : rating
      ));

      setModerationModalOpen(false);
      setSelectedRating(null);
      setModerationReason('');
    } catch (error) {
      console.error('Error moderating rating:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = 'blue', change }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
          {change && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
            </p>
          )}
        </div>
        <Icon className={`h-8 w-8 text-${color}-600`} />
      </div>
    </div>
  );

  const RatingStars = ({ rating, size = 4 }) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map(star => (
        <StarIcon
          key={star}
          className={`h-${size} w-${size} ${
            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  const FilterButton = ({ value, label, count, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label} ({count})
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rating Management</h1>
        <p className="text-gray-600">Monitor and moderate customer ratings</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Ratings"
            value={stats.totalRatings.toLocaleString()}
            icon={ChartBarIcon}
            color="blue"
          />
          <StatCard
            title="Average Rating"
            value={stats.averageRating.toFixed(1)}
            icon={StarIcon}
            color="yellow"
          />
          <StatCard
            title="Flagged"
            value={stats.flaggedRatings}
            icon={FlagIcon}
            color="red"
          />
          <StatCard
            title="Pending"
            value={stats.pendingModeration}
            icon={ExclamationTriangleIcon}
            color="orange"
          />
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.ratingBreakdown).reverse().map(([stars, count]) => (
              <div key={stars} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 w-20">
                  <span className="text-sm font-medium">{stars}</span>
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ 
                      width: `${(count / stats.totalRatings) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Ratings</h3>
        <div className="flex flex-wrap gap-3">
          <FilterButton
            value="all"
            label="All"
            count={ratings.length}
            isActive={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          <FilterButton
            value="flagged"
            label="Flagged"
            count={ratings.filter(r => r.isFlagged).length}
            isActive={filter === 'flagged'}
            onClick={() => setFilter('flagged')}
          />
          <FilterButton
            value="pending"
            label="Pending"
            count={ratings.filter(r => r.moderationStatus === 'pending').length}
            isActive={filter === 'pending'}
            onClick={() => setFilter('pending')}
          />
        </div>
      </div>

      {/* Ratings List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {filter === 'all' ? 'All Ratings' : 
             filter === 'flagged' ? 'Flagged Ratings' : 'Pending Moderation'}
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {ratings.map(rating => (
            <div key={rating._id} className="p-6 space-y-4">
              {/* Rating Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {rating.userId.name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{rating.userId.name}</p>
                    <p className="text-sm text-gray-600">
                      rated {rating.stylistId.userId.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <RatingStars rating={rating.overallRating} />
                  <span className="text-sm text-gray-600">
                    {new Date(rating.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800">{rating.review.content}</p>
              </div>

              {/* Status Badges */}
              <div className="flex items-center space-x-2">
                {rating.isFlagged && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <FlagIcon className="h-3 w-3 mr-1" />
                    Flagged
                  </span>
                )}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  rating.moderationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  rating.moderationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {rating.moderationStatus}
                </span>
                <span className="text-sm text-gray-600">
                  {rating.helpfulVotes} helpful, {rating.notHelpfulVotes} not helpful
                </span>
              </div>

              {/* Moderation Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedRating(rating);
                    setModerationAction('approve');
                    setModerationModalOpen(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    setSelectedRating(rating);
                    setModerationAction('reject');
                    setModerationModalOpen(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedRating(rating);
                    setModerationAction('flag');
                    setModerationModalOpen(true);
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <FlagIcon className="h-4 w-4 mr-1" />
                  Flag
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Moderation Modal */}
      {moderationModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {moderationAction.charAt(0).toUpperCase() + moderationAction.slice(1)} Rating
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for this action:
            </p>
            <textarea
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setModerationModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleModerationAction}
                disabled={!moderationReason.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}