import { Question, QuizResult, QuizSetup } from '@/types/quiz';

// Generate quiz questions using our API route
export async function generateQuizQuestions(setup: QuizSetup): Promise<Question[]> {
  try {
    const response = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(setup),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate quiz questions');
    }

    const questions = await response.json();
    return questions;
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    throw new Error('Failed to generate quiz questions. Please check your internet connection and try again.');
  }
}

// Analyze quiz results using our API route
export async function analyzeQuizResults(
  result: QuizResult,
  setup: QuizSetup
): Promise<{ weakTopics: string[]; recommendations: string[]; overallAssessment: string }> {
  try {
    const response = await fetch('/api/analyze-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ result, setup }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze quiz results');
    }

    const analysis = await response.json();
    return analysis;
  } catch (error) {
    console.error('Error analyzing quiz results:', error);
    throw new Error('Failed to analyze quiz results. Please try again.');
  }
}
