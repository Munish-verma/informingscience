import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Clock, CheckCircle, Star, Award, Calendar } from 'lucide-react';

interface ReviewAssignment {
  id: string;
  submissionId: string;
  title: string;
  journalName: string;
  assignedDate: string;
  dueDate: string;
  status: 'invited' | 'accepted' | 'completed' | 'withdrawn';
}

const ReviewerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - will be replaced with actual API call
    const mockAssignments: ReviewAssignment[] = [
      {
        id: '1',
        submissionId: 'SUB-2024-0001',
        title: 'Machine Learning Applications in Healthcare',
        journalName: 'Journal of Information Technology',
        assignedDate: '2024-01-15',
        dueDate: '2024-02-15',
        status: 'accepted'
      },
      {
        id: '2',
        submissionId: 'SUB-2024-0002',
        title: 'Blockchain Technology in Supply Chain Management',
        journalName: 'Information Systems Research',
        assignedDate: '2024-01-20',
        dueDate: '2024-02-20',
        status: 'invited'
      }
    ];
    
    setAssignments(mockAssignments);
    setIsLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'invited':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'withdrawn':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Reviewer Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.firstName}! Manage your review assignments and track your performance.
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {user?.stats?.totalReviews || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {user?.stats?.completedReviews || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Time</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {user?.stats?.averageReviewTime || 0} days
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rating</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {user?.stats?.reviewerRating ? `${user.stats.reviewerRating}/5` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Awards Section */}
      {user?.awards && user.awards.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Awards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {user.awards.map((award, index) => (
              <div key={index} className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
                <Award className={`h-6 w-6 mr-3 ${
                  award.type === 'gold' ? 'text-yellow-500' :
                  award.type === 'silver' ? 'text-gray-400' :
                  award.type === 'bronze' ? 'text-orange-600' : 'text-purple-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {award.type} Reviewer
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {award.year} • {award.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review Assignments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Review Assignments
          </h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No review assignments</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                You'll be notified when new assignments are available
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {assignment.journalName} • {assignment.submissionId}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                      </p>
                      <p className={`text-xs ${
                        isOverdue(assignment.dueDate) 
                          ? 'text-red-500' 
                          : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        {isOverdue(assignment.dueDate) && ' (Overdue)'}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                      {getStatusText(assignment.status)}
                    </span>
                    {assignment.status === 'invited' && (
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Respond
                      </button>
                    )}
                    {assignment.status === 'accepted' && (
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        Start Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">View All Reviews</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              See your complete review history
            </p>
          </button>
          
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <Calendar className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Set Availability</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update your reviewing schedule
            </p>
          </button>

          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <Award className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Reviewer Stats</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View your performance metrics
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewerDashboard;
