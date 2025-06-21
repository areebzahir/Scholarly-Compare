import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'professor' | 'student' | 'admin' | 'guest' | 'user';
  avatar?: string;
  createdAt: Date;
  lastLogin: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (stored in localStorage)
    const savedUser = localStorage.getItem('eduassess_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser({
          ...userData,
          createdAt: new Date(userData.createdAt),
          lastLogin: new Date(userData.lastLogin)
        });
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('eduassess_user');
      }
    }
    setLoading(false);
  }, []);

  const loginAsGuest = async () => {
    const guestUser: User = {
      id: 'guest-' + Date.now(),
      name: 'Guest User', // This will be updated from the login form
      email: 'guest@eduassess.ai',
      role: 'guest',
      createdAt: new Date(),
      lastLogin: new Date()
    };

    setUser(guestUser);
    localStorage.setItem('eduassess_user', JSON.stringify(guestUser));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('eduassess_user');
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('eduassess_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    loginAsGuest,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};