import React from 'react';
import { CogIcon } from '@heroicons/react/24/outline';

/**
 * Settings Page
 * Platform configuration and admin settings
 */
const Settings = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Platform configuration and admin settings
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <CogIcon className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Platform Settings</h3>
        <p className="text-gray-500 mb-4">
          This page will allow administrators to configure platform settings, 
          manage system preferences, and control various operational parameters.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-700">
            <strong>Coming Features:</strong> General settings, notification preferences, 
            security settings, API configurations, and system maintenance tools.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;