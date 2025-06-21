import React, { useState } from 'react';
import { 
  LogOut, 
  Upload, 
  Download, 
  FileText, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Award,
  Clock,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { compareAnswers } from '../services/geminiService';

interface User {
  name: string;
  role: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface StudentResult {
  name: string;
  answer: string;
  score: number;
  similarity: number;
  passed: boolean;
  feedback: string;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'similarity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAnswers, setShowAnswers] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentProcessing, setCurrentProcessing] = useState<string>('');

  const onDrop = async (acceptedFiles: File[]) => {
    if (!correctAnswer.trim()) {
      setError('Please enter the correct answer first before uploading student answers.');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    setError('');
    setUploadedFile(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResults) => {
        console.log('Parse results:', parseResults);
        
        if (parseResults.errors.length > 0) {
          console.error('CSV parsing errors:', parseResults.errors);
          setError('Error parsing CSV file. Please check the file format.');
          return;
        }

        const data = parseResults.data as any[];
        if (data.length === 0) {
          setError('CSV file is empty or has no data rows.');
          return;
        }

        // Check available columns
        const firstRow = data[0];
        const columns = Object.keys(firstRow);
        console.log('Available columns:', columns);

        // Find name and answer columns (case insensitive)
        const nameColumn = columns.find(col => 
          col.toLowerCase().includes('name') || 
          col.toLowerCase().includes('student')
        );
        const answerColumn = columns.find(col => 
          col.toLowerCase().includes('answer') || 
          col.toLowerCase().includes('response') ||
          col.toLowerCase().includes('text')
        );

        if (!nameColumn || !answerColumn) {
          setError(`Could not find required columns. Found columns: ${columns.join(', ')}. Please ensure your CSV has columns for student names and answers.`);
          return;
        }

        console.log(`Using columns - Name: "${nameColumn}", Answer: "${answerColumn}"`);

        const studentAnswers = data
          .filter((row: any) => {
            const name = row[nameColumn]?.toString().trim();
            const answer = row[answerColumn]?.toString().trim();
            return name && answer && name !== '' && answer !== '';
          })
          .map((row: any) => ({
            name: row[nameColumn].toString().trim(),
            answer: row[answerColumn].toString().trim()
          }));

        console.log('Filtered student answers:', studentAnswers);

        if (studentAnswers.length === 0) {
          setError(`No valid data found. Please ensure your CSV has data in the "${nameColumn}" and "${answerColumn}" columns.`);
          return;
        }

        setProcessing(true);
        setProgress(0);
        const processedResults: StudentResult[] = [];

        for (let i = 0; i < studentAnswers.length; i++) {
          const student = studentAnswers[i];
          setCurrentProcessing(student.name);
          
          try {
            console.log(`Processing student ${i + 1}/${studentAnswers.length}: ${student.name}`);
            const result = await compareAnswers(correctAnswer, student.answer);
            
            processedResults.push({
              name: student.name,
              answer: student.answer,
              score: result.score,
              similarity: result.similarity,
              passed: result.passed,
              feedback: result.feedback
            });
            
            // Update progress
            const progressPercent = ((i + 1) / studentAnswers.length) * 100;
            setProgress(progressPercent);
            console.log(`Progress: ${progressPercent.toFixed(1)}%`);
            
            // Delay to avoid rate limiting and show progress
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.error(`Error processing ${student.name}:`, error);
            processedResults.push({
              name: student.name,
              answer: student.answer,
              score: 0,
              similarity: 0,
              passed: false,
              feedback: 'Error processing answer - please review manually'
            });
          }
        }

        // Sort results by name initially
        const sortedResults = processedResults.sort((a, b) => 
          a.name.localeCompare(b.name)
        );

        setResults(sortedResults);
        setProcessing(false);
        setProgress(0);
        setCurrentProcessing('');

        // Save to localStorage
        const savedResults = JSON.parse(localStorage.getItem('assessment_results') || '[]');
        const newEntry = {
          id: Date.now(),
          correctAnswer,
          results: sortedResults,
          timestamp: new Date().toISOString(),
          processedBy: user.name,
          fileName: file.name
        };
        savedResults.push(newEntry);
        localStorage.setItem('assessment_results', JSON.stringify(savedResults));

        console.log('Processing complete. Results:', sortedResults);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setError('Error reading CSV file. Please check that it is a valid CSV format.');
        setUploadedFile('');
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.csv']
    },
    maxFiles: 1
  });

  const sortResults = (results: StudentResult[], sortBy: string, order: string) => {
    return [...results].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'score':
          aValue = a.score;
          bValue = b.score;
          break;
        case 'similarity':
          aValue = a.similarity;
          bValue = b.similarity;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  };

  const handleSort = (column: 'name' | 'score' | 'similarity') => {
    const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortOrder(newOrder);
    setResults(sortResults(results, column, newOrder));
  };

  const exportResults = () => {
    if (results.length === 0) return;

    const csvData = results.map(result => ({
      'Student Name': result.name,
      'Score (%)': result.score,
      'Similarity (%)': result.similarity,
      'Status': result.passed ? 'PASS' : 'FAIL',
      'Feedback': result.feedback,
      'Student Answer': result.answer
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setCorrectAnswer('');
    setResults([]);
    setProgress(0);
    setUploadedFile('');
    setSortBy('name');
    setSortOrder('asc');
    setError('');
    setCurrentProcessing('');
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                EduAssess AI
              </h1>
              <p className="text-sm text-gray-600">AI-Powered Answer Comparison</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors bg-white/50 px-3 py-2 rounded-lg hover:bg-white/80"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 font-medium">Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600 ml-auto"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            How to Use EduAssess AI
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ol className="list-decimal list-inside text-blue-800 space-y-2">
              <li>Enter the correct answer in the text area</li>
              <li>Upload a CSV file with student answers</li>
              <li>AI will compare each student answer</li>
              <li>View results sorted by name, score, or similarity</li>
              <li>Export results to CSV for record keeping</li>
            </ol>
            <div className="bg-white rounded-lg border border-blue-200 p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements:</p>
              <div className="text-xs text-blue-800 font-mono bg-blue-50 p-2 rounded border">
                name,answer<br/>
                John Doe,Photosynthesis converts light...<br/>
                Jane Smith,Plants use sunlight to make...
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Correct Answer Input */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Enter Correct Answer</h3>
            </div>
            <textarea
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Enter the correct/reference answer that student responses will be compared against..."
              rows={8}
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white/50 backdrop-blur-sm transition-all"
            />
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {correctAnswer.length} characters
              </p>
              {correctAnswer && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready for comparison
                </span>
              )}
            </div>
          </div>

          {/* CSV Upload */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Upload className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Step 2: Upload Student Answers</h3>
            </div>
            
            {!processing && results.length === 0 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50/50 scale-105' 
                    : correctAnswer 
                      ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30' 
                      : 'border-gray-200 bg-gray-50/50 cursor-not-allowed'
                }`}
              >
                <input {...getInputProps()} disabled={!correctAnswer} />
                <div className={`transition-all ${isDragActive ? 'scale-110' : ''}`}>
                  <Upload className={`h-12 w-12 mx-auto mb-4 ${correctAnswer ? 'text-blue-500' : 'text-gray-300'}`} />
                  <p className={`text-lg font-medium mb-2 ${correctAnswer ? 'text-gray-900' : 'text-gray-500'}`}>
                    {isDragActive ? 'Drop the CSV file here' : 'Upload CSV file with student answers'}
                  </p>
                  <p className={`text-sm ${correctAnswer ? 'text-gray-500' : 'text-gray-400'}`}>
                    Drag & drop or click to select
                  </p>
                  {!correctAnswer && (
                    <p className="text-sm text-red-500 mt-2 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Please enter the correct answer first
                    </p>
                  )}
                </div>
              </div>
            )}

            {processing && (
              <div className="text-center py-8">
                <div className="relative">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                  <RefreshCw className="h-6 w-6 text-blue-600 absolute top-3 left-1/2 transform -translate-x-1/2" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Processing answers with AI...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {Math.round(progress)}% complete
                </p>
                {currentProcessing && (
                  <p className="text-xs text-gray-500">
                    Currently processing: <span className="font-medium">{currentProcessing}</span>
                  </p>
                )}
                {uploadedFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    File: {uploadedFile}
                  </p>
                )}
              </div>
            )}

            {results.length > 0 && (
              <div className="text-center py-4">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Processing Complete!
                </p>
                <p className="text-sm text-gray-600">
                  {results.length} student answers processed
                </p>
                {uploadedFile && (
                  <p className="text-xs text-gray-500 mt-1">
                    File: {uploadedFile}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="mt-8 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Assessment Results
                </h3>
                <p className="text-sm text-gray-600">{results.length} students processed</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                >
                  {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showAnswers ? 'Hide' : 'Show'} Answers</span>
                </button>
                <button
                  onClick={exportResults}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-md"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={clearAll}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center">
                    <Users className="h-4 w-4 mr-1" />
                    Total Students
                  </div>
                </div>
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.passed).length}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Passed
                  </div>
                </div>
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => !r.passed).length}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    Failed
                  </div>
                </div>
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)}%
                  </div>
                  <div className="text-sm text-gray-600 flex items-center justify-center">
                    <Award className="h-4 w-4 mr-1" />
                    Average Score
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Student Name</span>
                        <span className="text-gray-400">{getSortIcon('name')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('score')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Score (%)</span>
                        <span className="text-gray-400">{getSortIcon('score')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSort('similarity')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Similarity (%)</span>
                        <span className="text-gray-400">{getSortIcon('similarity')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pass/Fail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feedback
                    </th>
                    {showAnswers && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Answer
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {result.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold px-3 py-1 rounded-full ${getScoreColor(result.score)}`}>
                          {result.score}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {result.similarity}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          result.passed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.passed ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              PASS
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              FAIL
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          <div className="truncate" title={result.feedback}>
                            {result.feedback}
                          </div>
                        </div>
                      </td>
                      {showAnswers && (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs">
                            <div className="truncate" title={result.answer}>
                              {result.answer.substring(0, 100)}
                              {result.answer.length > 100 ? '...' : ''}
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Guest Welcome */}
        {user.role === 'guest' && results.length === 0 && !correctAnswer && (
          <div className="mt-8 bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-white/20 p-8 text-center">
            <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-6">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, Guest!</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Explore our AI-powered assessment platform. Enter a correct answer and upload a CSV file 
              with student responses to see how our AI compares and scores them with detailed feedback.
            </p>
            <div className="bg-white rounded-xl p-6 max-w-md mx-auto shadow-sm border">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center justify-center">
                <FileText className="h-4 w-4 mr-2" />
                CSV Format Example:
              </h4>
              <div className="text-left text-sm text-gray-600 font-mono bg-gray-50 p-3 rounded-lg border">
                name,answer<br/>
                John Doe,Photosynthesis converts light energy...<br/>
                Jane Smith,Plants use sunlight to make glucose...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;