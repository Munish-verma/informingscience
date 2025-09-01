import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, FileText, Users, Award, Calendar, BookOpen } from 'lucide-react';

interface Submission {
  id: string;
  submissionId: string;
  title: string;
  status: string;
  submittedAt: string;
  journalId: {
    name: string;
    shortName: string;
  };
}

const UserDashboard: React.FC = () => {
  const { user, isMember } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserSubmissions();
  }, []);

  const fetchUserSubmissions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/submissions/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'published':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isMember() ? 'Member Dashboard' : 'Colleague Dashboard'}
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
                {submissions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Published Articles</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'published').length}
              </p>
            </div>
          </div>
        </div>

        {isMember() && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Peer Directory</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">Active</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Membership Status</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {user?.membershipStatus === 'active' ? 'Active' : 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Submissions
          </h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No submissions yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Start by submitting your first article
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.slice(0, 5).map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {submission.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {submission.journalId.name} • {submission.submissionId}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {getStatusText(submission.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Member Benefits Section */}
      {isMember() && (
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Member Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Peer Directory</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect with other members and find potential collaborators
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Priority Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get faster responses to your inquiries and support requests
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Submit New Article</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Submit your research to our journals
            </p>
          </button>
          
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <User className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Update Profile</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Keep your information current
            </p>
          </button>

          {isMember() && (
            <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
              <h3 className="font-medium text-gray-900 dark:text-white">Peer Directory</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Browse and connect with members
              </p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
