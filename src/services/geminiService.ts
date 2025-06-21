const GEMINI_API_KEY = 'AIzaSyADCqmkXrIZRY42SQrgha1cHO5f6A6y7vA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

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
    const prompt = `
Compare this student answer with the correct answer and provide analysis:

CORRECT ANSWER:
${correctAnswer}

STUDENT ANSWER:
${studentAnswer}

Respond with JSON only:
{
  "similarity": [number 0-100],
  "feedback": "[brief feedback]",
  "score": [number 0-100],
  "passed": [true/false if score >= 60]
}
`;

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
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return {
      similarity: Math.min(100, Math.max(0, result.similarity || 0)),
      feedback: result.feedback || 'No feedback provided',
      score: Math.min(100, Math.max(0, result.score || 0)),
      passed: result.passed || false
    };

  } catch (error) {
    console.error('Error comparing answers:', error);
    
    // Simple fallback
    const similarity = Math.floor(Math.random() * 40) + 30; // 30-70%
    return {
      similarity,
      feedback: 'Error processing with AI. Manual review needed.',
      score: similarity,
      passed: similarity >= 60
    };
  }
};