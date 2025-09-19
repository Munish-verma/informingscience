import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import CallForPapersPage from './pages/CallForPapersPage';
import PublicationsPage from './pages/PublicationsPage';
import JournalsPage from './pages/JournalsPage';
import ConferencesPage from './pages/ConferencesPage';
import CommunityPage from './pages/CommunityPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import ISIVideosPage from './pages/ISIVideosPage';
import MentorshipPage from './pages/MentorshipPage';
import SecondActPage from './pages/SecondActPage';
import SponsorUsPage from './pages/SponsorUsPage';
import AdvertisePage from './pages/AdvertisePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import EthicsPolicyPage from './pages/EthicsPolicyPage';
import LegalDisclaimerPage from './pages/LegalDisclaimerPage';
import SiteMapPage from './pages/SiteMapPage';
import JoinISIPage from './pages/JoinISIPage';
import ProfileEditPage from './pages/ProfileEditPage';
import MemberDashboardPage from './pages/MemberDashboardPage';
import YourArticlesPage from './pages/YourArticlesPage';
import YourReviewsPage from './pages/YourReviewsPage';
import NotificationsPage from './pages/NotificationsPage';
import PeerDirectoryPage from './pages/PeerDirectoryPage';
import MemberConferencesPage from './pages/MemberConferencesPage';
import MembershipOptionsPage from './pages/MembershipOptionsPage';

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, login, loading } = useAuth();
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

  const handleLogin = (token: string, admin: any) => {
    login(token, admin);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

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
          <Dashboard />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/call-for-papers" element={<CallForPapersPage />} />
          <Route path="/publications" element={<PublicationsPage />} />
          <Route path="/journals" element={<JournalsPage />} />
          <Route path="/conferences" element={<ConferencesPage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/isi-videos" element={<ISIVideosPage />} />
          <Route path="/mentorship" element={<MentorshipPage />} />
          <Route path="/second-act" element={<SecondActPage />} />
          <Route path="/sponsor-us" element={<SponsorUsPage />} />
          <Route path="/advertise" element={<AdvertisePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/ethics-policy" element={<EthicsPolicyPage />} />
          <Route path="/legal-disclaimer" element={<LegalDisclaimerPage />} />
          <Route path="/site-map" element={<SiteMapPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/join-isi" element={<JoinISIPage />} />
          <Route path="/profile-edit" element={<ProfileEditPage />} />
          <Route path="/member/dashboard" element={<MemberDashboardPage />} />
          <Route path="/member/articles" element={<YourArticlesPage />} />
          <Route path="/member/reviews" element={<YourReviewsPage />} />
          <Route path="/member/notifications" element={<NotificationsPage />} />
          <Route path="/member/peer-directory" element={<PeerDirectoryPage />} />
          <Route path="/member/conferences" element={<MemberConferencesPage />} />
          <Route path="/member/membership-options" element={<MembershipOptionsPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

