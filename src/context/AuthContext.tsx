import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountType: 'colleague' | 'member';
  roles: string[];
  membershipStatus: string;
  affiliation?: string;
  department?: string;
  position?: string;
  orcidId?: string;
  bio?: string;
  topicsOfInterest?: string[];
  socialLinks?: {
    website?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
  };
  country?: string;
  city?: string;
  isReviewer?: boolean;
  reviewerStatus?: string;
  stats?: {
    totalReviews: number;
    completedReviews: number;
    averageReviewTime: number;
    averageReviewScore: number;
    reviewerRating: number;
  };
  awards?: Array<{
    type: 'bronze' | 'silver' | 'gold' | 'platinum';
    year: number;
    description: string;
    awardedDate: Date;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  hasRole: (role: string) => boolean;
  isMember: () => boolean;
  isReviewer: () => boolean;
  isEditor: () => boolean;
  isEditorInChief: () => boolean;
  isAdministrator: () => boolean;
  isSuperAdmin: () => boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: 'colleague' | 'member';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check error:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateProfile = async (profileData: Partial<User>) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }

      setUser(data.user);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Role checking functions
  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const isMember = (): boolean => {
    return user?.accountType === 'member' && user?.membershipStatus === 'active';
  };

  const isReviewer = (): boolean => {
    return hasRole('reviewer') || user?.isReviewer === true;
  };

  const isEditor = (): boolean => {
    return hasRole('editor');
  };

  const isEditorInChief = (): boolean => {
    return hasRole('editor-in-chief');
  };

  const isAdministrator = (): boolean => {
    return hasRole('administrator');
  };

  const isSuperAdmin = (): boolean => {
    return hasRole('super-admin');
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    updateProfile,
    hasRole,
    isMember,
    isReviewer,
    isEditor,
    isEditorInChief,
    isAdministrator,
    isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



