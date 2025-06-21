import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BookOpen, 
  User, 
  LogOut, 
  Home,
  FileText,
  History,
  Moon,
  Sun,
  Monitor,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, actualTheme, setTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Previous Results', href: '/previous-results', icon: History },
    { name: 'Text Banks', href: '/text-banks', icon: FileText, roles: ['professor', 'admin'] },
  ];

  const themeOptions = [
    { name: 'Light', value: 'light' as const, icon: Sun },
    { name: 'Dark', value: 'dark' as const, icon: Moon },
    { name: 'System', value: 'system' as const, icon: Monitor },
  ];

  const filteredNavItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || 'student')
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl group-hover:scale-105 transition-transform">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Scholar Compare
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  AI-Powered Assessment
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side Menu */}
          <div className="flex items-center space-x-3">
            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200"
              >
                {actualTheme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </button>
              
              {isThemeMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                        theme === option.value
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <option.icon className="h-4 w-4 mr-3" />
                      {option.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                  />
                ) : (
                  <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user.role}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <div className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(isThemeMenuOpen || isUserMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsThemeMenuOpen(false);
            setIsUserMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navigation;