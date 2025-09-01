import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Users, Settings, BarChart3, Award, Calendar } from 'lucide-react';

interface JournalStats {
  totalSubmissions: number;
  underReview: number;
  awaitingDecision: number;
  published: number;
  rejectionRate: number;
}

const EditorInChiefDashboard: React.FC = () => {
  const { user } = useAuth();
  const [journalStats, setJournalStats] = useState<JournalStats>({
    totalSubmissions: 45,
    underReview: 12,
    awaitingDecision: 8,
    published: 25,
    rejectionRate: 22
  });
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Editor-in-Chief Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.firstName}! Oversee journal operations and manage the editorial team.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Submissions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {journalStats.totalSubmissions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Under Review</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {journalStats.underReview}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Awaiting Decision</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {journalStats.awaitingDecision}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Published</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {journalStats.published}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Journal Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Submissions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Submissions
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Machine Learning Applications in Healthcare
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    SUB-2024-0001 • Dr. John Smith
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Under Review
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Blockchain Technology in Supply Chain
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    SUB-2024-0002 • Dr. Jane Doe
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Awaiting Decision
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Editorial Team */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Editorial Team
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">Associate Editors</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">5 active editors</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Manage
                </button>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">Reviewers</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">24 active reviewers</p>
                  </div>
                </div>
                <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                  View All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">View All Submissions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Browse and manage all submissions
            </p>
          </button>
          
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <Users className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Manage Team</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Assign editors and reviewers
            </p>
          </button>

          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Journal Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure journal parameters
            </p>
          </button>

          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View performance metrics
            </p>
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Metrics
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {journalStats.rejectionRate}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejection Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                18 days
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Review Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                4.2/5
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Reviewer Satisfaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorInChiefDashboard;
