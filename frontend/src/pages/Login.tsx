import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BookOpen, 
  Mail,
  Lock,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  User,
  Users,
  UserPlus
} from 'lucide-react';

const Login: React.FC = () => {
  const { loginAsGuest, updateUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginAsGuest();
      // Update the user with the provided email
      await updateUserProfile({
        email: email.trim(),
        name: email.split('@')[0] || 'User', // Use part before @ as name
        role: 'user'
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim() || !fullName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginAsGuest();
      // Update the user with the provided information
      await updateUserProfile({
        email: email.trim(),
        name: fullName.trim(),
        role: 'user'
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Signup failed:', error);
      setError('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await loginAsGuest();
      // Keep default guest settings
      navigate('/dashboard');
    } catch (error) {
      console.error('Guest login failed:', error);
      setError('Guest login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const themeOptions = [
    { name: 'Light', value: 'light' as const, icon: Sun },
    { name: 'Dark', value: 'dark' as const, icon: Moon },
    { name: 'System', value: 'system' as const, icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Selector */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-white/20 dark:border-gray-700/20">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`p-2 rounded-md transition-all duration-200 ${
                theme === option.value
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
              }`}
              title={option.name}
            >
              <option.icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg animate-pulse">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Scholar Compare
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            AI-Powered Educational Assessment Platform
          </p>
        </div>

        {/* Login/Signup Form Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8 mb-6">
          {/* Tab Navigation */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === 'login'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Log In</span>
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === 'signup'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Sign Up</span>
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl mb-4">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {activeTab === 'login' 
                ? 'Sign in to access your assessment tools' 
                : 'Join us to start using AI-powered assessments'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Full Name (Sign Up Only) */}
            {activeTab === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && (activeTab === 'login' ? handleLogin() : handleSignup())}
                />
              </div>
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {activeTab === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    disabled={loading}
                    onKeyPress={(e) => e.key === 'Enter' && handleSignup()}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-6">
            {/* Primary Action Button */}
            <button
              onClick={activeTab === 'login' ? handleLogin : handleSignup}
              disabled={loading || !email.trim() || !password.trim() || (activeTab === 'signup' && (!confirmPassword.trim() || !fullName.trim()))}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 flex items-center justify-center space-x-3 group shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {activeTab === 'login' ? <User className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              <span>
                {loading 
                  ? (activeTab === 'login' ? 'Signing In...' : 'Creating Account...') 
                  : (activeTab === 'login' ? 'Log In' : 'Sign Up')
                }
              </span>
            </button>

            {/* Continue as Guest Button */}
            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-4 px-6 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 flex items-center justify-center space-x-3 group shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none border border-gray-300 dark:border-gray-600"
            >
              <Users className="h-5 w-5" />
              <span>{loading ? 'Loading...' : 'Continue as Guest'}</span>
            </button>
          </div>

          {/* Features List */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>AI-powered answer comparison</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Automated scoring and feedback</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Batch processing with CSV upload</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>Export results and analytics</span>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
            <strong>Quick Access:</strong> {activeTab === 'login' ? 'Use any email/password to log in' : \'Create an account with any email'}, or continue as guest to explore our AI assessment tools immediately.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2024 Scholar Compare. Revolutionizing education through AI.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;