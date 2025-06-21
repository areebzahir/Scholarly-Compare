import React from 'react';
import { BookOpen } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center transition-colors duration-300">
      <div className="text-center">
        <div className="relative">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg mb-6 animate-pulse">
            <BookOpen className="h-12 w-12 text-white" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl animate-ping opacity-20"></div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Scholar Compare
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Loading your dashboard...
        </p>
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;