import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import ReviewerDashboard from './components/ReviewerDashboard';
import EditorDashboard from './components/EditorDashboard';
import EditorInChiefDashboard from './components/EditorInChiefDashboard';
import AdminDashboard from './components/AdminDashboard';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved dark mode preference or default to system preference
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    } else {
      setDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Determine which dashboard to show based on user roles
  const getDashboardComponent = () => {
    if (!user) return <Dashboard />;

    // Check for admin roles first
    if (user.roles?.includes('super-admin')) {
      return <AdminDashboard />;
    }
    
    if (user.roles?.includes('administrator')) {
      return <AdminDashboard />;
    }

    // Check for editorial roles
    if (user.roles?.includes('editor-in-chief')) {
      return <EditorInChiefDashboard />;
    }

    if (user.roles?.includes('editor')) {
      return <EditorDashboard />;
    }

    // Check for reviewer role
    if (user.roles?.includes('reviewer') || user.isReviewer) {
      return <ReviewerDashboard />;
    }

    // Default to user dashboard for colleagues and members
    return <UserDashboard />;
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          darkMode={darkMode}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          {getDashboardComponent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

