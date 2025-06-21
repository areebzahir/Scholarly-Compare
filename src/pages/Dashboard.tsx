import React, { useState } from 'react';
import { LogOut, Upload, Download, FileText, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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

  const onDrop = async (acceptedFiles: File[]) => {
    if (!correctAnswer.trim()) {
      alert('Please enter the correct answer first before uploading student answers.');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFile(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResults) => {
        console.log('Parse results:', parseResults);
        
        if (parseResults.errors.length > 0) {
          console.error('CSV parsing errors:', parseResults.errors);
          alert('Error parsing CSV file. Please check the file format.');
          return;
        }

        // More flexible column detection
        const data = parseResults.data as any[];
        if (data.length === 0) {
          alert('CSV file is empty or has no data rows.');
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
          alert(`Could not find required columns. Found columns: ${columns.join(', ')}. Please ensure your CSV has columns for student names and answers.`);
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
          alert(`No valid data found. Please ensure your CSV has data in the "${nameColumn}" and "${answerColumn}" columns.`);
          return;
        }

        setProcessing(true);
        setProgress(0);
        const processedResults: StudentResult[] = [];

        for (let i = 0; i < studentAnswers.length; i++) {
          const student = studentAnswers[i];
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
            
            // Small delay to avoid rate limiting and show progress
            await new Promise(resolve => setTimeout(resolve, 1500));
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
        alert('Error reading CSV file. Please check that it is a valid CSV format.');
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
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">EduAssess AI</h1>
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
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">How to Use</h2>
          <ol className="list-decimal list-inside text-blue-800 space-y-1">
            <li>Enter the correct answer in the text area below</li>
            <li>Upload a CSV file with student answers</li>
            <li>AI will compare each student answer with the correct answer</li>
            <li>View results sorted by name, score, or similarity</li>
            <li>Export results to CSV for record keeping</li>
          </ol>
          <div className="mt-4 p-3 bg-white rounded border">
            <p className="text-sm font-medium text-blue-900 mb-1">CSV Format Requirements:</p>
            <p className="text-sm text-blue-800">Your CSV should have columns for student names and their answers. Common column names like "name", "student", "answer", "response" will be automatically detected.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Correct Answer Input */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Step 1: Enter Correct Answer</h3>
            </div>
            <textarea
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Enter the correct/reference answer that student responses will be compared against..."
              rows={8}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {correctAnswer.length} characters
              </p>
              {correctAnswer && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Ready for comparison
                </span>
              )}
            </div>
          </div>

          {/* CSV Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Upload className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Step 2: Upload Student Answers</h3>
            </div>
            
            {!processing && results.length === 0 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : correctAnswer 
                      ? 'border-gray-300 hover:border-blue-400' 
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <input {...getInputProps()} disabled={!correctAnswer} />
                <Upload className={`h-12 w-12 mx-auto mb-4 ${correctAnswer ? 'text-gray-400' : 'text-gray-300'}`} />
                <p className={`text-lg font-medium mb-2 ${correctAnswer ? 'text-gray-900' : 'text-gray-500'}`}>
                  {isDragActive ? 'Drop the CSV file here' : 'Upload CSV file with student answers'}
                </p>
                <p className={`text-sm ${correctAnswer ? 'text-gray-500' : 'text-gray-400'}`}>
                  Drag & drop or click to select
                </p>
                {!correctAnswer && (
                  <p className="text-sm text-red-500 mt-2">
                    Please enter the correct answer first
                  </p>
                )}
              </div>
            )}

            {processing && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Processing answers with AI...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {Math.round(progress)}% complete
                </p>
                {uploadedFile && (
                  <p className="text-xs text-gray-500 mt-2">
                    Processing: {uploadedFile}
                  </p>
                )}
              </div>
            )}

            {results.length > 0 && (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
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
          <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Assessment Results</h3>
                <p className="text-sm text-gray-600">{results.length} students processed</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={exportResults}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={clearAll}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                  <div className="text-sm text-gray-600">Total Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.filter(r => r.passed).length}
                  </div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {results.filter(r => !r.passed).length}
                  </div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)}%
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Student Name</span>
                        <span className="text-gray-400">{getSortIcon('name')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('score')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Score (%)</span>
                        <span className="text-gray-400">{getSortIcon('score')}</span>
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Answer
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {result.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-bold ${
                          result.score >= 80 ? 'text-green-600' :
                          result.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {result.score}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {result.similarity}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs">
                          <div className="truncate" title={result.answer}>
                            {result.answer.substring(0, 100)}
                            {result.answer.length > 100 ? '...' : ''}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Guest View */}
        {user.role === 'guest' && results.length === 0 && !correctAnswer && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-8 text-center">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome, Guest!</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              You can explore the AI-powered assessment platform. Enter a correct answer and upload a CSV file 
              with student responses to see how the AI compares and scores them.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
              <h4 className="font-semibold text-gray-900 mb-2">CSV Format Example:</h4>
              <div className="text-left text-sm text-gray-600 font-mono bg-white p-2 rounded border">
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