import React from 'react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.firstName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.lastName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.email}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{user.accountType}</p>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Professional Information</h2>
                
                {user.affiliation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Affiliation</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.affiliation}</p>
                  </div>
                )}
                
                {user.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.department}</p>
                  </div>
                )}
                
                {user.position && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.position}</p>
                  </div>
                )}
                
                {user.orcidId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ORCID ID</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{user.orcidId}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Roles */}
            {user.roles && user.roles.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Roles</h2>
                <div className="flex flex-wrap gap-2">
                  {user.roles.map((role, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {role.replace('-', ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {user.bio && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bio</h2>
                <p className="text-sm text-gray-700 dark:text-gray-300">{user.bio}</p>
              </div>
            )}

            {/* Topics of Interest */}
            {user.topicsOfInterest && user.topicsOfInterest.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Topics of Interest</h2>
                <div className="flex flex-wrap gap-2">
                  {user.topicsOfInterest.map((topic, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
