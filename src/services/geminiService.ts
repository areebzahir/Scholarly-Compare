const GEMINI_API_KEY = 'AIzaSyADCqmkXrIZRY42SQrgha1cHO5f6A6y7vA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

export interface ComparisonResult {
  similarity: number;
  feedback: string;
  score: number;
  passed: boolean;
}

export const compareAnswers = async (
  correctAnswer: string,
  studentAnswer: string
): Promise<ComparisonResult> => {
  try {
    // Validate inputs
    if (!correctAnswer?.trim() || !studentAnswer?.trim()) {
      throw new Error('Both correct answer and student answer are required');
    }

    const prompt = `
You are an expert educational assessment AI. Compare the student answer with the correct answer and provide analysis.

CORRECT ANSWER:
${correctAnswer.trim()}

STUDENT ANSWER:
${studentAnswer.trim()}

Please analyze and respond with ONLY a JSON object in this exact format:
{
  "similarity": 75,
  "feedback": "Good understanding of key concepts. Could improve on specific details.",
  "score": 78,
  "passed": true
}

Rules:
- similarity: number from 0-100 representing conceptual similarity
- feedback: brief constructive feedback (max 100 characters)
- score: number from 0-100 based on accuracy and completeness
- passed: true if score >= 60, false otherwise

Focus on conceptual understanding, accuracy, and completeness.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid API response structure');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('AI Response:', aiResponse);
    
    // Clean and extract JSON from response
    let jsonText = aiResponse.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/, '').replace(/```\s*$/, '');
    
    // Find JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in AI response');
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Raw text:', jsonMatch[0]);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // Validate and sanitize the result
    const sanitizedResult = {
      similarity: Math.min(100, Math.max(0, Number(result.similarity) || 0)),
      feedback: String(result.feedback || 'No feedback provided').substring(0, 200),
      score: Math.min(100, Math.max(0, Number(result.score) || 0)),
      passed: Boolean(result.passed)
    };

    // Ensure passed status matches score
    sanitizedResult.passed = sanitizedResult.score >= 60;

    console.log('Processed result:', sanitizedResult);
    return sanitizedResult;

  } catch (error) {
    console.error('Error comparing answers:', error);
    
    // Enhanced fallback analysis
    try {
      const correctWords = correctAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const studentWords = studentAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      
      const commonWords = correctWords.filter(word => 
        studentWords.some(sw => sw.includes(word) || word.includes(sw))
      );
      
      const similarity = Math.min(95, (commonWords.length / Math.max(correctWords.length, 1)) * 100);
      const score = Math.round(similarity * 0.8); // Slightly lower than similarity
      
      return {
        similarity: Math.round(similarity),
        feedback: `AI analysis unavailable. Basic word matching shows ${Math.round(similarity)}% similarity.`,
        score: score,
        passed: score >= 60
      };
    } catch (fallbackError) {
      console.error('Fallback analysis failed:', fallbackError);
      return {
        similarity: 0,
        feedback: 'Error processing answer. Please review manually.',
        score: 0,
        passed: false
      };
    }
  }
};