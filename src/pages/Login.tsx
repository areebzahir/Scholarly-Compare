import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BookOpen, 
  Users,
  Moon,
  Sun,
  Monitor,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const Login: React.FC = () => {
  const { loginAsGuest } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
      navigate('/dashboard');
    } catch (error) {
      console.error('Guest login failed:', error);
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
            EduAssess AI
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            AI-Powered Educational Assessment Platform
          </p>
        </div>

        {/* Welcome Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8 mb-6">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl mb-4">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to EduAssess AI
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Experience the power of AI-driven assessment tools. Compare student answers with reference solutions and get detailed feedback instantly.
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-6">
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
              <span>Detailed analytics and insights</span>
            </div>
          </div>

          {/* Guest Login Button */}
          <button
            onClick={handleGuestLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 flex items-center justify-center space-x-3 group shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            <Users className="h-5 w-5" />
            <span>Continue as Guest</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
            <strong>No registration required!</strong> Start exploring our AI assessment tools immediately with guest access.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>© 2024 EduAssess AI. Revolutionizing education through AI.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;