// MongoDB Atlas connection and operations
const MONGODB_URI = 'mongodb+srv://username:password@cluster.mongodb.net/eduassess?retryWrites=true&w=majority';

export interface TextBank {
  _id?: string;
  title: string;
  correctAnswer: string;
  createdBy: string;
  createdAt: Date;
}

export interface AssessmentResult {
  _id?: string;
  textBankId: string;
  studentName: string;
  studentAnswer: string;
  score: number;
  similarity: number;
  passed: boolean;
  feedback: string;
  processedAt: Date;
}

// Simple API calls to backend (we'll create these endpoints)
const API_BASE = '/api';

// Helper function to check if API is available
async function isApiAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

export const mongoService = {
  // Text Banks
  async createTextBank(textBank: Omit<TextBank, '_id' | 'createdAt'>): Promise<TextBank> {
    const apiAvailable = await isApiAvailable();
    
    if (apiAvailable) {
      try {
        const response = await fetch(`${API_BASE}/textbanks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...textBank, createdAt: new Date() })
        });
        
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.warn('API call failed, falling back to localStorage');
      }
    }
    
    // Fallback to localStorage
    const newTextBank: TextBank = {
      _id: Date.now().toString(),
      ...textBank,
      createdAt: new Date()
    };
    
    const existing = JSON.parse(localStorage.getItem(`textbanks_${textBank.createdBy}`) || '[]');
    existing.push(newTextBank);
    localStorage.setItem(`textbanks_${textBank.createdBy}`, JSON.stringify(existing));
    
    return newTextBank;
  },

  async getTextBanks(createdBy: string): Promise<TextBank[]> {
    const apiAvailable = await isApiAvailable();
    
    if (apiAvailable) {
      try {
        const response = await fetch(`${API_BASE}/textbanks?createdBy=${createdBy}`);
        
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return response.json();
        }
      } catch (error) {
        console.warn('API call failed, falling back to localStorage');
      }
    }
    
    // Fallback to localStorage
    const saved = localStorage.getItem(`textbanks_${createdBy}`);
    return saved ? JSON.parse(saved) : [];
  },

  async deleteTextBank(id: string): Promise<void> {
    const apiAvailable = await isApiAvailable();
    
    if (apiAvailable) {
      try {
        const response = await fetch(`${API_BASE}/textbanks/${id}`, { method: 'DELETE' });
        if (response.ok) {
          return;
        }
      } catch (error) {
        console.warn('API call failed, falling back to localStorage');
      }
    }
    
    // Fallback to localStorage - we need to find which user's storage to update
    // This is a limitation of the localStorage approach
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.startsWith('textbanks_')) {
        const banks = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = banks.filter((bank: TextBank) => bank._id !== id);
        if (filtered.length !== banks.length) {
          localStorage.setItem(key, JSON.stringify(filtered));
          break;
        }
      }
    }
  },

  // Assessment Results
  async saveResults(results: Omit<AssessmentResult, '_id' | 'processedAt'>[]): Promise<AssessmentResult[]> {
    const apiAvailable = await isApiAvailable();
    
    if (apiAvailable) {
      try {
        const response = await fetch(`${API_BASE}/results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(results.map(r => ({ ...r, processedAt: new Date() })))
        });
        
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.warn('API call failed, falling back to localStorage');
      }
    }
    
    // Fallback to localStorage
    const savedResults = JSON.parse(localStorage.getItem('assessment_results') || '[]');
    const newResults = results.map(r => ({
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      ...r,
      processedAt: new Date()
    }));
    
    savedResults.push(...newResults);
    localStorage.setItem('assessment_results', JSON.stringify(savedResults));
    
    return newResults;
  },

  async getResults(textBankId: string): Promise<AssessmentResult[]> {
    const apiAvailable = await isApiAvailable();
    
    if (apiAvailable) {
      try {
        const response = await fetch(`${API_BASE}/results?textBankId=${textBankId}`);
        
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return response.json();
        }
      } catch (error) {
        console.warn('API call failed, falling back to localStorage');
      }
    }
    
    // Fallback to localStorage
    const savedResults = JSON.parse(localStorage.getItem('assessment_results') || '[]');
    return savedResults.filter((result: AssessmentResult) => result.textBankId === textBankId);
  },

  async getAllResults(createdBy: string): Promise<AssessmentResult[]> {
    const apiAvailable = await isApiAvailable();
    
    if (apiAvailable) {
      try {
        const response = await fetch(`${API_BASE}/results/all?createdBy=${createdBy}`);
        
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return response.json();
        }
      } catch (error) {
        console.warn('API call failed, falling back to localStorage');
      }
    }
    
    // Fallback to localStorage
    const savedResults = JSON.parse(localStorage.getItem('assessment_results') || '[]');
    // For localStorage, we don't have a direct way to filter by createdBy
    // This would require storing additional metadata
    return savedResults;
  }
};