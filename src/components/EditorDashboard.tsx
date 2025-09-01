import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Clock, CheckCircle, Users, MessageSquare, Calendar } from 'lucide-react';

interface EditorSubmission {
  id: string;
  submissionId: string;
  title: string;
  journalName: string;
  authors: string[];
  assignedDate: string;
  dueDate: string;
  status: string;
  reviewCount: number;
  completedReviews: number;
}

const EditorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<EditorSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - will be replaced with actual API call
    const mockSubmissions: EditorSubmission[] = [
      {
        id: '1',
        submissionId: 'SUB-2024-0001',
        title: 'Machine Learning Applications in Healthcare',
        journalName: 'Journal of Information Technology',
        authors: ['Dr. John Smith', 'Dr. Jane Doe'],
        assignedDate: '2024-01-15',
        dueDate: '2024-02-15',
        status: 'under_review',
        reviewCount: 3,
        completedReviews: 2
      },
      {
        id: '2',
        submissionId: 'SUB-2024-0002',
        title: 'Blockchain Technology in Supply Chain Management',
        journalName: 'Information Systems Research',
        authors: ['Dr. Robert Johnson'],
        assignedDate: '2024-01-20',
        dueDate: '2024-02-20',
        status: 'review_completed',
        reviewCount: 2,
        completedReviews: 2
      }
    ];
    
    setSubmissions(mockSubmissions);
    setIsLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'review_completed':
        return 'bg-blue-100 text-blue-800';
      case 'awaiting_editor_decision':
        return 'bg-purple-100 text-purple-800';
      case 'decision_made':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Editor Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.firstName}! Manage your assigned submissions and make editorial decisions.
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned Submissions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {submissions.length}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Under Review</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'under_review').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Awaiting Decision</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'review_completed').length}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Decisions Made</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'decision_made').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Submissions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assigned Submissions
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
              <p className="text-gray-600 dark:text-gray-400">No assigned submissions</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                You'll be notified when new assignments are made
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {submission.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {submission.journalName} • {submission.submissionId}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Authors: {submission.authors.join(', ')}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Assigned: {new Date(submission.assignedDate).toLocaleDateString()}
                      </p>
                      <p className={`text-xs ${
                        isOverdue(submission.dueDate) 
                          ? 'text-red-500' 
                          : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        Due: {new Date(submission.dueDate).toLocaleDateString()}
                        {isOverdue(submission.dueDate) && ' (Overdue)'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Reviews: {submission.completedReviews}/{submission.reviewCount}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                      {getStatusText(submission.status)}
                    </span>
                    {submission.status === 'review_completed' && (
                      <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                        Make Decision
                      </button>
                    )}
                    {submission.status === 'under_review' && (
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Progress
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
            <h3 className="font-medium text-gray-900 dark:text-white">View All Submissions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              See your complete assignment history
            </p>
          </button>
          
          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <Users className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Manage Reviewers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Assign and communicate with reviewers
            </p>
          </button>

          <button className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Decision Templates</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Access editorial decision templates
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorDashboard;
