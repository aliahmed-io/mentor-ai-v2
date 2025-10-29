import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { QuizResult, QuizSetup } from '@/types/quiz';

// JSON schema for improvement analysis
const improvementAnalysisSchema = {
  type: "object",
  properties: {
    weakTopics: {
      type: "array",
      items: { type: "string" }
    },
    recommendations: {
      type: "array",
      items: { type: "string" }
    },
    overallAssessment: { type: "string" }
  },
  required: ["weakTopics", "recommendations", "overallAssessment"]
};

export async function POST(request: NextRequest) {
  try {
    const { result, setup }: { result: QuizResult; setup: QuizSetup } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const client = new GoogleGenAI({ apiKey });
    
    // Build analysis prompt
    const incorrectQuestions = result.answers
      .filter(answer => !answer.isCorrect && answer.selectedAnswer !== null)
      .map(answer => {
        const question = result.questions.find(q => q.id === answer.questionId);
        return question ? {
          question: question.question,
          topic: question.topic,
          correctAnswer: question.options[question.correctAnswer],
          selectedAnswer: answer.selectedAnswer !== null ? question.options[answer.selectedAnswer] : 'Not answered',
          explanation: question.explanation
        } : null;
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    const unansweredQuestions = result.answers
      .filter(answer => answer.selectedAnswer === null)
      .map(answer => {
        const question = result.questions.find(q => q.id === answer.questionId);
        return question ? {
          question: question.question,
          topic: question.topic
        } : null;
      })
      .filter((q): q is NonNullable<typeof q> => q !== null);

    const prompt = `Analyze this quiz performance and provide improvement recommendations:

QUIZ DETAILS:
- Topic: ${setup.topic}
- Difficulty: ${setup.difficulty}
- Total Questions: ${result.totalQuestions}
- Correct Answers: ${result.correctAnswers}
- Incorrect Answers: ${result.incorrectAnswers}
- Unanswered: ${result.unanswered}
- Score: ${result.percentage.toFixed(1)}%

INCORRECT ANSWERS:
${incorrectQuestions.map((q, i) => `${i + 1}. Question: "${q.question}"
   - Selected: ${q.selectedAnswer}
   - Correct: ${q.correctAnswer}
   - Topic: ${q.topic}`).join('\n')}

UNANSWERED QUESTIONS:
${unansweredQuestions.map((q, i) => `${i + 1}. "${q.question}" (Topic: ${q.topic})`).join('\n')}

INSTRUCTIONS:
- Identify the main weak areas/topics based on incorrect and unanswered questions
- Provide specific, actionable study recommendations
- Give an overall assessment of the performance
- Be encouraging but honest about areas needing improvement
- Focus on learning strategies that match the ${setup.difficulty} difficulty level
- Limit weak topics to the most important 3-5 areas
- Provide 5-8 specific recommendations

Return analysis in the exact JSON format specified.`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: improvementAnalysisSchema,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    if (!response.text) {
      throw new Error('No response text received from Gemini API');
    }

    const analysis = JSON.parse(response.text);
    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Error analyzing quiz results:', error);
    return NextResponse.json(
      { error: 'Failed to analyze quiz results' },
      { status: 500 }
    );
  }
}
