import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Users, Brain, Award, Mail, Lock, User, ArrowRight } from 'lucide-react';


const Landing: React.FC = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [role, setRole] = useState<'professor' | 'guest'>('professor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const success = await login(email, password, role);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleGuestAccess = async () => {
    const success = await login('guest@example.com', 'guest123', 'guest');
    if (success) {
      navigate('/dashboard');
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI compares student answers with reference solutions for accurate assessment'
    },
    {
      icon: Users,
      title: 'Batch Processing',
      description: 'Upload CSV files with multiple student answers for efficient bulk assessment'
    },
    {
      icon: Award,
      title: 'Detailed Feedback',
      description: 'Comprehensive scoring with personalized feedback and improvement suggestions'
    },
    {
      icon: BookOpen,
      title: 'Text Bank Management',
      description: 'Organize and manage your reference solutions for different subjects and topics'
    }
  ];

  if (isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <BookOpen className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Access your educational assessment dashboard
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-xl p-8">
            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select your role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('professor')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    role === 'professor'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Professor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('guest')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    role === 'guest'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">Guest</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email"
                  />
                  <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                  />
                  <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6">
              <button
                onClick={() => setIsLogin(false)}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-500"
              >
                ← Back to home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">EduAssess AI</span>
            </div>
            <button
              onClick={() => setIsLogin(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            AI-Powered
            <span className="text-blue-600"> Educational</span>
            <br />
            Assessment Platform
          </h1>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Revolutionize your grading process with intelligent answer comparison, 
            automated scoring, and comprehensive feedback powered by advanced AI technology.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsLogin(true)}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              Get Started as Professor
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button
              onClick={handleGuestAccess}
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Powerful Features for Modern Education
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Everything you need to streamline your assessment process
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="bg-blue-100 rounded-lg p-3 w-fit">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold">
              Ready to Transform Your Assessment Process?
            </h2>
            <p className="mt-4 text-xl text-blue-100">
              Join thousands of educators already using AI to improve their grading efficiency
            </p>
            <button
              onClick={() => setIsLogin(true)}
              className="mt-8 bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Your Free Trial
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold">EduAssess AI</span>
            </div>
            <p className="text-gray-400">
              Empowering educators with intelligent assessment tools
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;