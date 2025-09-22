import React from 'react';
import { ScissorsIcon } from '@heroicons/react/24/outline';

/**
 * Stylists Management Page
 * Manage stylist profiles, approvals, and services
 */
const Stylists = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Stylists Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage stylist profiles, approvals, and services
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <ScissorsIcon className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Stylists Management</h3>
        <p className="text-gray-500 mb-4">
          This page will allow you to manage stylist profiles, review applications, 
          approve new stylists, and monitor their service offerings.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-700">
            <strong>Coming Features:</strong> Stylist approval workflow, profile management, 
            service catalog management, performance metrics, and rating systems.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Stylists;