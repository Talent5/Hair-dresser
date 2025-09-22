import React, { useState, useEffect } from 'react';
import { 
  ScissorsIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  StarIcon,
  MapPinIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  BadgeCheckIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';

/**
 * Stylists Management Page
 * Manage stylist profiles, approvals, and services
 */
const Stylists = () => {
  const [stylists, setStylists] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStylist, setSelectedStylist] = useState(null);
  const [isStylistModalOpen, setIsStylistModalOpen] = useState(false);

  useEffect(() => {
    fetchStylists();
  }, [currentPage, searchTerm, verifiedFilter, statusFilter]);

  const fetchStylists = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getStylists({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        verified: verifiedFilter,
        status: statusFilter
      });
      
      if (response.success) {
        setStylists(response.data.stylists || []);
        setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        console.error('Failed to fetch stylists:', response.message);
        setStylists([]);
        setPagination({ current: 1, pages: 1, total: 0 });
      }
    } catch (error) {
      console.error('Error fetching stylists:', error);
      setStylists([]);
      setPagination({ current: 1, pages: 1, total: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyStylist = async (stylistId) => {
    try {
      const response = await apiService.verifyStylist(stylistId);
      
      if (response.success) {
        // Refresh stylists list
        fetchStylists();
        setIsStylistModalOpen(false);
      } else {
        console.error('Failed to verify stylist:', response.message);
      }
    } catch (error) {
      console.error('Error verifying stylist:', error);
    }
  };

  const handleSuspendStylist = async (stylistId, reason = 'Admin action') => {
    try {
      const response = await apiService.suspendStylist(stylistId, reason);
      
      if (response.success) {
        // Refresh stylists list
        fetchStylists();
        setIsStylistModalOpen(false);
      } else {
        console.error('Failed to suspend stylist:', response.message);
      }
    } catch (error) {
      console.error('Error suspending stylist:', error);
    }
  };

  const handleActivateStylist = async (stylistId) => {
    try {
      const response = await apiService.updateUserStatus(stylistId, true);
      
      if (response.success) {
        // Refresh stylists list
        fetchStylists();
        setIsStylistModalOpen(false);
      } else {
        console.error('Failed to activate stylist:', response.message);
      }
    } catch (error) {
      console.error('Error activating stylist:', error);
    }
  };

  const handleViewStylist = (stylist) => {
    setSelectedStylist(stylist);
    setIsStylistModalOpen(true);
  };

  const getVerificationBadge = (verified) => {
    return verified ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <BadgeCheckIcon className="w-4 h-4 mr-1" />
        Verified
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
        Unverified
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="w-4 h-4 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircleIcon className="w-4 h-4 mr-1" />
        Inactive
      </span>
    );
  };

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
            Stylists Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage stylist profiles, approvals, and services ({pagination.total} total stylists)
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search stylists by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Verification Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Verification Status</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stylists Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            All Stylists ({pagination.total})
          </h3>
          
          {stylists.length === 0 ? (
            <div className="text-center py-8">
              <ScissorsIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No stylists found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || verifiedFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No stylists have registered yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stylist
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact & Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience & Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stylists.map((stylist) => (
                    <tr key={stylist._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {stylist.name ? stylist.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'S'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{stylist.name || 'Unknown Stylist'}</div>
                            <div className="text-sm text-gray-500">ID: {stylist._id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <div className="text-sm text-gray-900">{stylist.email}</div>
                          </div>
                          {stylist.phone && (
                            <div className="flex items-center space-x-1">
                              <PhoneIcon className="h-4 w-4 text-gray-400" />
                              <div className="text-sm text-gray-500">{stylist.phone}</div>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <MapPinIcon className="h-4 w-4 text-gray-400" />
                            <div className="text-sm text-gray-500">{stylist.location?.city || 'Location not specified'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {stylist.stylistProfile?.experience || 'Not specified'}
                          </div>
                          {stylist.stylistProfile?.rating && (
                            <div className="flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-500 ml-1">
                                {stylist.stylistProfile.rating} ({stylist.stylistProfile.reviewCount || 0} reviews)
                              </span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {stylist.stylistProfile?.services?.length || 0} services offered
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVerificationBadge(stylist.stylistProfile?.verified)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(stylist.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleViewStylist(stylist)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {!stylist.stylistProfile?.verified && (
                            <button 
                              onClick={() => handleVerifyStylist(stylist._id)}
                              className="text-green-600 hover:text-green-900"
                              title="Verify Stylist"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                          {stylist.isActive && (
                            <button 
                              onClick={() => handleSuspendStylist(stylist._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Suspend Stylist"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                disabled={currentPage === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.current}</span> of{' '}
                  <span className="font-medium">{pagination.pages}</span> ({pagination.total} total results)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(Math.min(5, pagination.pages))].map((_, index) => {
                    let page;
                    if (pagination.pages <= 5) {
                      page = index + 1;
                    } else if (currentPage <= 3) {
                      page = index + 1;
                    } else if (currentPage >= pagination.pages - 2) {
                      page = pagination.pages - 4 + index;
                    } else {
                      page = currentPage - 2 + index;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                    disabled={currentPage === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stylist Details Modal */}
      {isStylistModalOpen && selectedStylist && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Stylist Details</h3>
                <button
                  onClick={() => setIsStylistModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-lg font-medium text-purple-600">
                      {selectedStylist.name ? selectedStylist.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'S'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{selectedStylist.name}</h4>
                    <p className="text-sm text-gray-500">{selectedStylist.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {getVerificationBadge(selectedStylist.stylistProfile?.verified)}
                      {getStatusBadge(selectedStylist.isActive)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStylist.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Join Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedStylist.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experience</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStylist.stylistProfile?.experience || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStylist.location?.city || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <div className="mt-1 flex items-center">
                      {selectedStylist.stylistProfile?.rating ? (
                        <>
                          <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-900 ml-1">
                            {selectedStylist.stylistProfile.rating} ({selectedStylist.stylistProfile.reviewCount || 0} reviews)
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No rating yet</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Bookings</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStylist.stylistProfile?.totalBookings || 0}</p>
                  </div>
                </div>

                {selectedStylist.stylistProfile?.services && selectedStylist.stylistProfile.services.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Services Offered</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedStylist.stylistProfile.services.map((service, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStylist.stylistProfile?.bio && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStylist.stylistProfile.bio}</p>
                  </div>
                )}

                {selectedStylist.suspensionReason && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Suspension Reason</label>
                    <p className="mt-1 text-sm text-red-600">{selectedStylist.suspensionReason}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsStylistModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                
                {!selectedStylist.stylistProfile?.verified && (
                  <button
                    onClick={() => handleVerifyStylist(selectedStylist._id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Verify Stylist
                  </button>
                )}
                
                {selectedStylist.isActive ? (
                  <button
                    onClick={() => handleSuspendStylist(selectedStylist._id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivateStylist(selectedStylist._id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Activate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stylists;