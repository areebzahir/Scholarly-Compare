import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface TextBank {
  id?: string;
  title: string;
  subject: string;
  description: string;
  correctAnswer: string;
  maxScore: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  studentsProcessed?: number;
}

export interface AssessmentResult {
  id?: string;
  textBankId: string;
  studentName: string;
  studentAnswer: string;
  score: number;
  similarity: number;
  passed: boolean;
  feedback: string;
  processedAt: Date;
  processedBy: string;
}

export interface UserStats {
  totalAssessments: number;
  totalStudents: number;
  averageScore: number;
  passRate: number;
}

class DatabaseService {
  // Text Banks
  async createTextBank(textBank: Omit<TextBank, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'textBanks'), {
        ...textBank,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        studentsProcessed: 0
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating text bank:', error);
      throw error;
    }
  }

  async getTextBanks(userId: string): Promise<TextBank[]> {
    try {
      const q = query(
        collection(db, 'textBanks'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as TextBank[];
    } catch (error) {
      console.error('Error getting text banks:', error);
      throw error;
    }
  }

  async getTextBank(id: string): Promise<TextBank | null> {
    try {
      const docRef = doc(db, 'textBanks', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt.toDate(),
          updatedAt: docSnap.data().updatedAt.toDate()
        } as TextBank;
      }
      return null;
    } catch (error) {
      console.error('Error getting text bank:', error);
      throw error;
    }
  }

  async updateTextBank(id: string, updates: Partial<TextBank>): Promise<void> {
    try {
      const docRef = doc(db, 'textBanks', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating text bank:', error);
      throw error;
    }
  }

  async deleteTextBank(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'textBanks', id));
      
      // Also delete associated results
      const resultsQuery = query(
        collection(db, 'assessmentResults'),
        where('textBankId', '==', id)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      
      const deletePromises = resultsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting text bank:', error);
      throw error;
    }
  }

  // Assessment Results
  async saveAssessmentResults(results: Omit<AssessmentResult, 'id' | 'processedAt'>[]): Promise<string[]> {
    try {
      const promises = results.map(result => 
        addDoc(collection(db, 'assessmentResults'), {
          ...result,
          processedAt: Timestamp.now()
        })
      );
      
      const docRefs = await Promise.all(promises);
      
      // Update text bank with student count
      if (results.length > 0) {
        const textBankRef = doc(db, 'textBanks', results[0].textBankId);
        await updateDoc(textBankRef, {
          studentsProcessed: results.length,
          updatedAt: Timestamp.now()
        });
      }
      
      return docRefs.map(ref => ref.id);
    } catch (error) {
      console.error('Error saving assessment results:', error);
      throw error;
    }
  }

  async getAssessmentResults(textBankId: string): Promise<AssessmentResult[]> {
    try {
      const q = query(
        collection(db, 'assessmentResults'),
        where('textBankId', '==', textBankId),
        orderBy('processedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        processedAt: doc.data().processedAt.toDate()
      })) as AssessmentResult[];
    } catch (error) {
      console.error('Error getting assessment results:', error);
      throw error;
    }
  }

  async getAllUserResults(userId: string): Promise<AssessmentResult[]> {
    try {
      const q = query(
        collection(db, 'assessmentResults'),
        where('processedBy', '==', userId),
        orderBy('processedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        processedAt: doc.data().processedAt.toDate()
      })) as AssessmentResult[];
    } catch (error) {
      console.error('Error getting user results:', error);
      throw error;
    }
  }

  // Analytics
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const textBanks = await this.getTextBanks(userId);
      const results = await this.getAllUserResults(userId);
      
      const totalAssessments = textBanks.length;
      const totalStudents = results.length;
      const averageScore = results.length > 0 
        ? results.reduce((sum, result) => sum + result.score, 0) / results.length 
        : 0;
      const passRate = results.length > 0 
        ? (results.filter(result => result.passed).length / results.length) * 100 
        : 0;

      return {
        totalAssessments,
        totalStudents,
        averageScore: Math.round(averageScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();