import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  FileText, 
  Upload, 
  Edit3, 
  Trash2, 
  Eye,
  Save,
  X,
  Download,
  Users
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { batchCompareAnswers, StudentAnswer } from '../services/geminiService';

interface TextBank {
  id: string;
  title: string;
  subject: string;
  description: string;
  correctAnswer: string;
  maxScore: number;
  createdAt: string;
  studentsProcessed?: number;
}

const TextBanks: React.FC = () => {
  const { user } = useAuth();
  const [textBanks, setTextBanks] = useState<TextBank[]>([
    {
      id: '1',
      title: 'Photosynthesis Process',
      subject: 'Biology',
      description: 'Explain the process of photosynthesis and its significance',
      correctAnswer: 'Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen. This process occurs in chloroplasts and involves two main stages: light-dependent reactions and light-independent reactions (Calvin cycle). The significance includes producing oxygen for the atmosphere, serving as the foundation of food chains, and converting solar energy into chemical energy.',
      maxScore: 100,
      createdAt: '2024-01-15',
      studentsProcessed: 25
    },
    {
      id: '2',
      title: 'Newton\'s Laws of Motion',
      subject: 'Physics',
      description: 'Describe and provide examples of Newton\'s three laws of motion',
      correctAnswer: 'Newton\'s First Law (Law of Inertia): An object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force. Newton\'s Second Law: Force equals mass times acceleration (F=ma). Newton\'s Third Law: For every action, there is an equal and opposite reaction. Examples include a ball rolling on a frictionless surface (first law), pushing a car (second law), and walking (third law).',
      maxScore: 100,
      createdAt: '2024-01-12',
      studentsProcessed: 18
    }
  ]);

  const [isCreating, setIsCreating] = useState(false);
  const [editingBank, setEditingBank] = useState<TextBank | null>(null);
  const [selectedBank, setSelectedBank] = useState<TextBank | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<StudentAnswer[]>([]);

  const [newBank, setNewBank] = useState({
    title: '',
    subject: '',
    description: '',
    correctAnswer: '',
    maxScore: 100
  });

  const handleCreateBank = () => {
    if (!newBank.title || !newBank.correctAnswer) return;

    const bank: TextBank = {
      id: Date.now().toString(),
      ...newBank,
      createdAt: new Date().toISOString().split('T')[0],
      studentsProcessed: 0
    };

    setTextBanks([...textBanks, bank]);
    setNewBank({ title: '', subject: '', description: '', correctAnswer: '', maxScore: 100 });
    setIsCreating(false);
  };

  const handleEditBank = (bank: TextBank) => {
    setEditingBank(bank);
    setNewBank({
      title: bank.title,
      subject: bank.subject,
      description: bank.description,
      correctAnswer: bank.correctAnswer,
      maxScore: bank.maxScore
    });
  };

  const handleUpdateBank = () => {
    if (!editingBank || !newBank.title || !newBank.correctAnswer) return;

    setTextBanks(textBanks.map(bank => 
      bank.id === editingBank.id 
        ? { ...bank, ...newBank }
        : bank
    ));
    setEditingBank(null);
    setNewBank({ title: '', subject: '', description: '', correctAnswer: '', maxScore: 100 });
  };

  const handleDeleteBank = (id: string) => {
    setTextBanks(textBanks.filter(bank => bank.id !== id));
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (!selectedBank) return;

    const file = acceptedFiles[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const studentAnswers: StudentAnswer[] = results.data
          .filter((row: any) => row.name && row.answer)
          .map((row: any) => ({
            name: row.name,
            answer: row.answer
          }));

        if (studentAnswers.length === 0) {
          alert('No valid student answers found in the CSV file. Please ensure your CSV has "name" and "answer" columns.');
          return;
        }

        setProcessing(true);
        setProgress(0);

        try {
          const processedResults = await batchCompareAnswers(
            selectedBank.correctAnswer,
            studentAnswers,
            selectedBank.maxScore,
            setProgress
          );

          setResults(processedResults);
          
          // Update the text bank with the number of students processed
          setTextBanks(textBanks.map(bank => 
            bank.id === selectedBank.id 
              ? { ...bank, studentsProcessed: processedResults.length }
              : bank
          ));
        } catch (error) {
          console.error('Error processing answers:', error);
          alert('Error processing student answers. Please try again.');
        } finally {
          setProcessing(false);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error reading CSV file. Please check the file format.');
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  });

  const exportResults = () => {
    if (results.length === 0) return;

    const csvData = results.map(student => ({
      Name: student.name,
      Answer: student.answer,
      Score: student.result?.score || 0,
      Similarity: student.result?.similarity || 0,
      Passed: student.result?.passed ? 'Yes' : 'No',
      Feedback: student.result?.feedback || ''
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedBank?.title}_results.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (user?.role !== 'professor') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Access Restricted
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Text bank management is only available for professors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Text Banks
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your reference solutions and assess student answers
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Bank
        </button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingBank) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingBank ? 'Edit Text Bank' : 'Create New Text Bank'}
            </h2>
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingBank(null);
                setNewBank({ title: '', subject: '', description: '', correctAnswer: '', maxScore: 100 });
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={newBank.title}
                onChange={(e) => setNewBank({ ...newBank, title: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter assessment title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={newBank.subject}
                onChange={(e) => setNewBank({ ...newBank, subject: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., Biology, Physics, Math"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={newBank.description}
                onChange={(e) => setNewBank({ ...newBank, description: e.target.value })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Brief description of the assessment"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Correct Answer
              </label>
              <textarea
                value={newBank.correctAnswer}
                onChange={(e) => setNewBank({ ...newBank, correctAnswer: e.target.value })}
                rows={6}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter the reference solution that student answers will be compared against"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Score
              </label>
              <input
                type="number"
                value={newBank.maxScore}
                onChange={(e) => setNewBank({ ...newBank, maxScore: parseInt(e.target.value) })}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={() => {
                setIsCreating(false);
                setEditingBank(null);
                setNewBank({ title: '', subject: '', description: '', correctAnswer: '', maxScore: 100 });
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={editingBank ? handleUpdateBank : handleCreateBank}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingBank ? 'Update' : 'Create'} Bank
            </button>
          </div>
        </div>
      )}

      {/* Text Banks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {textBanks.map((bank) => (
          <div
            key={bank.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {bank.title}
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {bank.subject}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditBank(bank)}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteBank(bank.id)}
                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {bank.description}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span>Max Score: {bank.maxScore}</span>
              <span>{bank.studentsProcessed || 0} students processed</span>
            </div>

            <button
              onClick={() => setSelectedBank(bank)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Student Answers
            </button>
          </div>
        ))}
      </div>

      {/* Upload Interface */}
      {selectedBank && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Upload Student Answers for: {selectedBank.title}
            </h2>
            <button
              onClick={() => {
                setSelectedBank(null);
                setResults([]);
                setProgress(0);
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!processing && results.length === 0 && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {isDragActive ? 'Drop the CSV file here' : 'Upload CSV file with student answers'}
              </p>
              <p className="text-gray-500 dark:text-gray-400">
                CSV should have columns: "name" and "answer"
              </p>
            </div>
          )}

          {processing && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Processing student answers...
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Assessment Results ({results.length} students)
                </h3>
                <button
                  onClick={exportResults}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((student, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {student.name}
                      </h4>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          student.result?.passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {student.result?.score || 0}%
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          student.result?.passed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.result?.passed ? 'PASS' : 'FAIL'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Similarity: {student.result?.similarity || 0}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {student.result?.feedback?.substring(0, 100)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TextBanks;