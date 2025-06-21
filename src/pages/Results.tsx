import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Award, 
  Clock,
  FileText,
  Download,
  Filter
} from 'lucide-react';

const Results: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Mock data for demonstration
  const overallStats = [
    {
      title: 'Total Assessments',
      value: '42',
      change: '+8',
      changeType: 'increase',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Students Evaluated',
      value: '1,247',
      change: '+156',
      changeType: 'increase',
      icon: Users,
      color: 'text-green-600'
    },
    {
      title: 'Average Score',
      value: '84.2%',
      change: '+3.1%',
      changeType: 'increase',
      icon: Award,
      color: 'text-yellow-600'
    },
    {
      title: 'Pass Rate',
      value: '87.5%',
      change: '+2.3%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  const scoreDistribution = [
    { range: '90-100', students: 245, percentage: 35 },
    { range: '80-89', students: 189, percentage: 27 },
    { range: '70-79', students: 156, percentage: 22 },
    { range: '60-69', students: 89, percentage: 13 },
    { range: '0-59', students: 21, percentage: 3 }
  ];

  const subjectPerformance = [
    { subject: 'Biology', avgScore: 87.2, students: 342, passRate: 91 },
    { subject: 'Physics', avgScore: 82.1, students: 298, passRate: 85 },
    { subject: 'Chemistry', avgScore: 79.8, students: 276, passRate: 82 },
    { subject: 'Mathematics', avgScore: 88.5, students: 331, passRate: 93 }
  ];

  const performanceTrend = [
    { week: 'Week 1', avgScore: 78.2, passRate: 82 },
    { week: 'Week 2', avgScore: 81.5, passRate: 85 },
    { week: 'Week 3', avgScore: 83.1, passRate: 87 },
    { week: 'Week 4', avgScore: 84.2, passRate: 89 }
  ];

  const pieChartData = [
    { name: 'Excellent (90-100)', value: 35, color: '#10B981' },
    { name: 'Good (80-89)', value: 27, color: '#3B82F6' },
    { name: 'Fair (70-79)', value: 22, color: '#F59E0B' },
    { name: 'Poor (60-69)', value: 13, color: '#EF4444' },
    { name: 'Fail (0-59)', value: 3, color: '#6B7280' }
  ];

  const recentAssessments = [
    {
      id: 1,
      title: 'Cellular Respiration Quiz',
      subject: 'Biology',
      students: 28,
      avgScore: 89.3,
      passRate: 96,
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: 2,
      title: 'Kinematics Problem Set',
      subject: 'Physics',
      students: 24,
      avgScore: 82.7,
      passRate: 88,
      date: '2024-01-14',
      status: 'completed'
    },
    {
      id: 3,
      title: 'Organic Chemistry Reactions',
      subject: 'Chemistry',
      students: 31,
      avgScore: 76.4,
      passRate: 81,
      date: '2024-01-13',
      status: 'completed'
    },
    {
      id: 4,
      title: 'Calculus Integration',
      subject: 'Mathematics',
      students: 26,
      avgScore: 91.2,
      passRate: 100,
      date: '2024-01-12',
      status: 'completed'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assessment Results
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive analytics and performance insights
          </p>
        </div>
        
        <div className="flex space-x-4 mt-4 md:mt-0">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="semester">This Semester</option>
            <option value="year">This Year</option>
          </select>
          
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Subjects</option>
            <option value="biology">Biology</option>
            <option value="physics">Physics</option>
            <option value="chemistry">Chemistry</option>
            <option value="mathematics">Mathematics</option>
          </select>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {overallStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color}`}>
                <stat.icon className="h-8 w-8" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {stat.changeType === 'increase' ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                from last period
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Score Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Score Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="students" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Performance Overview
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Subject Performance
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#10B981" name="Average Score" />
              <Bar dataKey="passRate" fill="#3B82F6" name="Pass Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Performance Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgScore" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Average Score"
              />
              <Line 
                type="monotone" 
                dataKey="passRate" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Pass Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Assessments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Assessments
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Avg Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pass Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentAssessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {assessment.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {assessment.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {assessment.students}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {assessment.avgScore}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {assessment.passRate}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {assessment.date}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {assessment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Results;