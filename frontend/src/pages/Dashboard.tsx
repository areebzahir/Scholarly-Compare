import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Award,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Target,
  BarChart3,
  Save
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { compareAnswers } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface StudentResult {
  name: string;
  answer: string;
  score: number;
  similarity: number;
  passed: boolean;
  feedback: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
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
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (!correctAnswer.trim()) {
      setError('Please enter the correct answer first before uploading student answers.');
      return;
    }

    try {
      await fetch("http://localhost:5000/api/answerdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctAnswer }),
      });
    } catch (error) {
      console.error("Failed to send correct answer:", error);
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


        const formData = new FormData();
        formData.append("file", file);

        try {
          await fetch("http://localhost:5000/api/file", {
            method: "POST",
            body: formData,
          });
        } catch (error) {
          console.error("Failed to send CSV file:", error);
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

  const saveResults = () => {
    if (results.length === 0) {
      alert('No results to save. Please process some student answers first.');
      return;
    }

    const savedResults = JSON.parse(localStorage.getItem('assessment_results') || '[]');
    const newEntry = {
      id: Date.now(),
      correctAnswer,
      results: results,
      timestamp: new Date().toISOString(),
      processedBy: user?.name || 'Unknown',
      fileName: uploadedFile || 'Manual Entry',
      title: `Assessment - ${new Date().toLocaleDateString()}`
    };

    savedResults.push(newEntry);
    localStorage.setItem('assessment_results', JSON.stringify(savedResults));

    alert('Results saved successfully! You can view them in the Previous Results page.');
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
    setExpandedStudent(null);
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20';
    if (score >= 80) return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20';
    if (score >= 60) return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20';
    return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20';
  };

  const toggleStudentExpansion = (studentName: string) => {
    setExpandedStudent(expandedStudent === studentName ? null : studentName);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 dark:text-red-400 font-medium">Error</h4>
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600 dark:hover:text-red-300 ml-auto"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            How to Use Scholar Compare
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ol className="list-decimal list-inside text-blue-800 dark:text-blue-300 space-y-2">
              <li>Enter the correct answer in the text area</li>
              <li>Upload a CSV file with student answers</li>
              <li>AI will compare each student answer</li>
              <li>Click on any student to see detailed feedback</li>
              <li>Save or export results for record keeping</li>
            </ol>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">CSV Format Requirements:</p>
              <div className="text-xs text-blue-800 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/30 p-2 rounded border">
                name,answer<br />
                John Doe,Photosynthesis converts light...<br />
                Jane Smith,Plants use sunlight to make...
              </div>
            </div>
          </div>
        </div>

        {/* Correct Answer Input */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Step 1: Enter Correct Answer</h3>
            </div>
            <textarea
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Enter the correct/reference answer that student responses will be compared against..."
              rows={8}
              className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {correctAnswer.length} characters
              </p>
              {correctAnswer && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready for comparison
                </span>
              )}
            </div>
          </div>

          {/* CSV Upload */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Step 2: Upload Student Answers</h3>
            </div>

            {!processing && results.length === 0 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-105'
                  : correctAnswer
                    ? 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 cursor-not-allowed'
                  }`}
              >
                <input {...getInputProps()} disabled={!correctAnswer} />

                <div className={`transition-all ${isDragActive ? 'scale-110' : ''}`}>
                  <Upload className={`h-12 w-12 mx-auto mb-4 ${correctAnswer ? 'text-blue-500 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600'}`} />
                  <p className={`text-lg font-medium mb-2 ${correctAnswer ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isDragActive ? 'Drop the CSV file here' : 'Upload CSV file with student answers'}
                  </p>
                  <p className={`text-sm ${correctAnswer ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    Drag & drop or click to select
                  </p>
                  {!correctAnswer && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-2 flex items-center justify-center">
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
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 mb-4"></div>
                  <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400 absolute top-3 left-1/2 transform -translate-x-1/2" />
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Processing answers with AI...
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {Math.round(progress)}% complete
                </p>
                {currentProcessing && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Currently processing: <span className="font-medium">{currentProcessing}</span>
                  </p>
                )}
                {uploadedFile && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    File: {uploadedFile}
                  </p>
                )}
              </div>
            )}

            {results.length > 0 && (
              <div className="text-center py-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-fit mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Processing Complete!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {results.length} student answers processed
                </p>
                {uploadedFile && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    File: {uploadedFile}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="mt-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Assessment Results
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{results.length} students processed • Click any student for details</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAnswers(!showAnswers)}
                  className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center space-x-2"
                >
                  {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showAnswers ? 'Hide' : 'Show'} Answers</span>
                </button>
                <button
                  onClick={saveResults}
                  className="bg-purple-600 dark:bg-purple-700 text-white px-4 py-2 rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center space-x-2 shadow-md"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Results</span>
                </button>
                <button
                  onClick={exportResults}
                  className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center space-x-2 shadow-md"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={clearAll}
                  className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors shadow-md"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{results.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                    <Users className="h-4 w-4 mr-1" />
                    Total Students
                  </div>
                </div>
                <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {results.filter(r => r.passed).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Passed
                  </div>
                </div>
                <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {results.filter(r => !r.passed).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    Failed
                  </div>
                </div>
                <div className="text-center bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
                    <Award className="h-4 w-4 mr-1" />
                    Average Score
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student Details
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      onClick={() => handleSort('score')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Score (%)</span>
                        <span className="text-gray-400 dark:text-gray-500">{getSortIcon('score')}</span>
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      onClick={() => handleSort('similarity')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Similarity (%)</span>
                        <span className="text-gray-400 dark:text-gray-500">{getSortIcon('similarity')}</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pass/Fail
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quick Feedback
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((result, index) => (
                    <React.Fragment key={index}>
                      <tr
                        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                        onClick={() => toggleStudentExpansion(result.name)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full mr-3">
                              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                                {result.name}
                              </div>
                              {expandedStudent === result.name ? (
                                <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-bold px-3 py-1 rounded-full ${getScoreColor(result.score)}`}>
                            {result.score}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white font-medium">
                            {result.similarity}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${result.passed
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
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
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                            <div className="truncate" title={result.feedback}>
                              {result.feedback.substring(0, 60)}
                              {result.feedback.length > 60 ? '...' : ''}
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {expandedStudent === result.name && (
                        <tr>
                          <td colSpan={5} className="px-6 py-6 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Student Answer */}
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center mb-3">
                                  <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                                  <h4 className="font-semibold text-gray-900 dark:text-white">Student Answer</h4>
                                </div>
                                <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border max-h-40 overflow-y-auto">
                                  {result.answer}
                                </div>
                              </div>

                              {/* Detailed Feedback & Analysis */}
                              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center mb-3">
                                  <Target className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                                  <h4 className="font-semibold text-gray-900 dark:text-white">Detailed Analysis</h4>
                                </div>

                                {/* Score Breakdown */}
                                <div className="mb-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Score</span>
                                    <span className={`text-lg font-bold ${result.score >= 60 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                      {result.score}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full transition-all ${result.score >= 60 ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                      style={{ width: `${result.score}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Content Similarity</span>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{result.similarity}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full transition-all"
                                      style={{ width: `${result.similarity}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Detailed Feedback */}
                                <div>
                                  <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">AI Feedback</h5>
                                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border">
                                    {result.feedback}
                                  </div>
                                </div>

                                {/* Performance Indicators */}
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${result.score >= 90 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' :
                                    result.score >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                                      result.score >= 70 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                                        result.score >= 60 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' :
                                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                    }`}>
                                    <BarChart3 className="h-3 w-3 mr-1" />
                                    {result.score >= 90 ? 'Excellent' :
                                      result.score >= 80 ? 'Good' :
                                        result.score >= 70 ? 'Satisfactory' :
                                          result.score >= 60 ? 'Needs Improvement' :
                                            'Requires Review'}
                                  </span>

                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${result.similarity >= 80 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' :
                                    result.similarity >= 60 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400' :
                                      'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                                    }`}>
                                    <Target className="h-3 w-3 mr-1" />
                                    {result.similarity >= 80 ? 'High Similarity' :
                                      result.similarity >= 60 ? 'Moderate Similarity' :
                                        'Low Similarity'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Guest Welcome */}
        {user.role === 'guest' && results.length === 0 && !correctAnswer && (
          <div className="mt-8 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl shadow-lg border border-white/20 dark:border-gray-700/20 p-8 text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full w-fit mx-auto mb-6">
              <Users className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Welcome, Guest!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Explore our AI-powered assessment platform. Enter a correct answer and upload a CSV file
              with student responses to see how our AI compares and scores them with detailed feedback.
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-auto shadow-sm border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-center">
                <FileText className="h-4 w-4 mr-2" />
                CSV Format Example:
              </h4>
              <div className="text-left text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border">
                name,answer<br />
                John Doe,Photosynthesis converts light energy...<br />
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