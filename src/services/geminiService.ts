const GEMINI_API_KEY = 'AIzaSyADCqmkXrIZRY42SQrgha1cHO5f6A6y7vA';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

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

    const prompt = `You are an expert educational assessment AI. Compare the student answer with the correct answer.

CORRECT ANSWER:
${correctAnswer.trim()}

STUDENT ANSWER:
${studentAnswer.trim()}

Analyze the student's answer and provide a JSON response with these exact fields:
- similarity: A number from 0-100 representing how conceptually similar the answers are
- feedback: Brief constructive feedback (under 150 characters)
- score: A number from 0-100 representing the overall quality and accuracy
- passed: true if score >= 60, false otherwise

Consider:
1. Conceptual understanding and accuracy
2. Completeness of the answer
3. Use of correct terminology
4. Overall clarity and coherence

Respond with ONLY valid JSON in this format:
{"similarity": 85, "feedback": "Good understanding, but missing key details about...", "score": 78, "passed": true}`;

    console.log('Sending request to Gemini API...');

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
          temperature: 0.1,
          topK: 32,
          topP: 0.8,
          maxOutputTokens: 512,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid API response structure');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    console.log('AI Response Text:', aiResponse);
    
    // Clean the response and extract JSON
    let cleanResponse = aiResponse.trim();
    
    // Remove any markdown formatting
    cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    cleanResponse = cleanResponse.replace(/```\s*/g, '');
    
    // Find the JSON object
    const jsonMatch = cleanResponse.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
    
    if (!jsonMatch) {
      console.error('No JSON found in response:', cleanResponse);
      throw new Error('No valid JSON found in AI response');
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
      console.log('Parsed result:', result);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Attempted to parse:', jsonMatch[0]);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // Validate and sanitize the result
    const sanitizedResult: ComparisonResult = {
      similarity: Math.min(100, Math.max(0, Number(result.similarity) || 0)),
      feedback: String(result.feedback || 'No feedback provided').substring(0, 200),
      score: Math.min(100, Math.max(0, Number(result.score) || 0)),
      passed: Boolean(result.passed)
    };

    // Ensure passed status is consistent with score
    if (sanitizedResult.score >= 60 && !sanitizedResult.passed) {
      sanitizedResult.passed = true;
    } else if (sanitizedResult.score < 60 && sanitizedResult.passed) {
      sanitizedResult.passed = false;
    }

    console.log('Final sanitized result:', sanitizedResult);
    return sanitizedResult;

  } catch (error) {
    console.error('Error in compareAnswers:', error);
    
    // Enhanced fallback analysis
    try {
      const correctWords = correctAnswer.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
      
      const studentWords = studentAnswer.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
      
      // Calculate word overlap
      const commonWords = correctWords.filter(word => 
        studentWords.some(sw => 
          sw === word || 
          sw.includes(word) || 
          word.includes(sw) ||
          (word.length > 4 && sw.length > 4 && 
           (word.substring(0, 4) === sw.substring(0, 4)))
        )
      );
      
      const similarity = Math.min(95, (commonWords.length / Math.max(correctWords.length, 1)) * 100);
      
      // Length factor
      const lengthRatio = Math.min(studentAnswer.length / correctAnswer.length, 1);
      const lengthBonus = lengthRatio * 10;
      
      const score = Math.round(Math.min(90, similarity * 0.7 + lengthBonus));
      
      return {
        similarity: Math.round(similarity),
        feedback: `AI analysis unavailable. Word matching shows ${Math.round(similarity)}% similarity. ${score >= 60 ? 'Shows understanding of key concepts.' : 'Consider reviewing the topic more thoroughly.'}`,
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