import React, { useState, useEffect } from 'react';
import { 
  History, 
  Download, 
  Trash2, 
  Eye,
  Calendar,
  Users,
  Award,
  FileText,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Target,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Papa from 'papaparse';

interface SavedResult {
  id: number;
  correctAnswer: string;
  results: Array<{
    name: string;
    answer: string;
    score: number;
    similarity: number;
    passed: boolean;
    feedback: string;
  }>;
  timestamp: string;
  processedBy: string;
  fileName: string;
  title?: string;
}

const PreviousResults: React.FC = () => {
  const [savedResults, setSavedResults] = useState<SavedResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'students' | 'avgScore'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const [selectedResults, setSelectedResults] = useState<number[]>([]);

  useEffect(() => {
    loadSavedResults();
  }, []);

  const loadSavedResults = () => {
    const saved = localStorage.getItem('assessment_results');
    if (saved) {
      try {
        const results = JSON.parse(saved);
        setSavedResults(results);
      } catch (error) {
        console.error('Error loading saved results:', error);
      }
    }
  };

  const filteredAndSortedResults = savedResults
    .filter(result => 
      result.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.processedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (result.title && result.title.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'students':
          aValue = a.results.length;
          bValue = b.results.length;
          break;
        case 'avgScore':
          aValue = a.results.reduce((sum, r) => sum + r.score, 0) / a.results.length;
          bValue = b.results.reduce((sum, r) => sum + r.score, 0) / b.results.length;
          break;
        default:
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const handleSort = (column: 'date' | 'students' | 'avgScore') => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newOrder);
  };

  const exportResult = (result: SavedResult) => {
    const csvData = result.results.map(student => ({
      'Student Name': student.name,
      'Score (%)': student.score,
      'Similarity (%)': student.similarity,
      'Status': student.passed ? 'PASS' : 'FAIL',
      'Feedback': student.feedback,
      'Student Answer': student.answer
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.fileName.replace('.csv', '')}_results_${new Date(result.timestamp).toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const deleteResult = (id: number) => {
    if (confirm('Are you sure you want to delete this assessment result?')) {
      const updatedResults = savedResults.filter(result => result.id !== id);
      setSavedResults(updatedResults);
      localStorage.setItem('assessment_results', JSON.stringify(updatedResults));
      setExpandedResult(null);
    }
  };

  const deleteSelectedResults = () => {
    if (selectedResults.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedResults.length} selected assessment result(s)?`)) {
      const updatedResults = savedResults.filter(result => !selectedResults.includes(result.id));
      setSavedResults(updatedResults);
      localStorage.setItem('assessment_results', JSON.stringify(updatedResults));
      setSelectedResults([]);
      setExpandedResult(null);
    }
  };

  const toggleResultSelection = (id: number) => {
    setSelectedResults(prev => 
      prev.includes(id) 
        ? prev.filter(resultId => resultId !== id)
        : [...prev, id]
    );
  };

  const selectAllResults = () => {
    if (selectedResults.length === filteredAndSortedResults.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(filteredAndSortedResults.map(result => result.id));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20';
    if (score >= 80) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
    if (score >= 60) return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20';
    return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <History className="h-8 w-8 mr-3 text-blue-600 dark:text-blue-400" />
            Previous Results
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage your saved assessment results
          </p>
        </div>
        
        {selectedResults.length > 0 && (
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedResults.length} selected
            </span>
            <button
              onClick={deleteSelectedResults}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by file name, processed by, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'students' | 'avgScore')}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="date">Sort by Date</option>
                <option value="students">Sort by Students</option>
                <option value="avgScore">Sort by Avg Score</option>
              </select>
            </div>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Results List */}
      {filteredAndSortedResults.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Previous Results Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm ? 'No results match your search criteria.' : 'You haven\'t saved any assessment results yet.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedResults.length === filteredAndSortedResults.length && filteredAndSortedResults.length > 0}
                onChange={selectAllResults}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select All ({filteredAndSortedResults.length} results)
              </span>
            </div>
          </div>

          {/* Results */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedResults.map((result) => {
              const avgScore = Math.round(result.results.reduce((sum, r) => sum + r.score, 0) / result.results.length);
              const passRate = Math.round((result.results.filter(r => r.passed).length / result.results.length) * 100);
              const isExpanded = expandedResult === result.id;

              return (
                <div key={result.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedResults.includes(result.id)}
                          onChange={() => toggleResultSelection(result.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {result.title || result.fileName}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(result.timestamp).toLocaleDateString()}
                                </span>
                                <span className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {result.results.length} students
                                </span>
                                <span className="flex items-center">
                                  <Award className="h-4 w-4 mr-1" />
                                  {avgScore}% avg
                                </span>
                                <span>by {result.processedBy}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(avgScore)}`}>
                            {avgScore}%
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            passRate >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                            passRate >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          }`}>
                            {passRate}% pass rate
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => exportResult(result)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Export to CSV"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteResult(result.id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setExpandedResult(isExpanded ? null : result.id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-gray-50 dark:bg-gray-700/50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Correct Answer */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <Target className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                            Correct Answer
                          </h4>
                          <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border max-h-32 overflow-y-auto">
                            {result.correctAnswer}
                          </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                            <BarChart3 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                            Summary Statistics
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {result.results.filter(r => r.passed).length}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Passed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {result.results.filter(r => !r.passed).length}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {Math.round(result.results.reduce((sum, r) => sum + r.similarity, 0) / result.results.length)}%
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Avg Similarity</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {result.results.length}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">Total Students</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Student Results Preview */}
                      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                          Student Results Preview
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                          {result.results.slice(0, 9).map((student, index) => (
                            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                  {student.name}
                                </span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  student.passed 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                }`}>
                                  {student.passed ? (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  )}
                                  {student.score}%
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Similarity: {student.similarity}%
                              </div>
                            </div>
                          ))}
                          {result.results.length > 9 && (
                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex items-center justify-center text-gray-500 dark:text-gray-400">
                              <span className="text-sm">+{result.results.length - 9} more</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviousResults;