import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { QuizSetup } from '@/types/quiz';
import { auth } from '@/server/auth';
import { db } from '@/server/db';

// JSON schema for quiz questions
const quizQuestionsSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 4
          },
          correctAnswer: { 
            type: "integer",
            minimum: 0,
            maximum: 3
          },
          explanation: { type: "string" },
          topic: { type: "string" }
        },
        required: ["id", "question", "options", "correctAnswer", "explanation", "topic"]
      }
    }
  },
  required: ["questions"]
};

export async function POST(request: NextRequest) {
  try {
    const setup: QuizSetup = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const client = new GoogleGenAI({ apiKey });
    
    // Build the prompt with context and guardrails
    let prompt = `Generate ${setup.questionCount} multiple-choice quiz questions about "${setup.topic}" at ${setup.difficulty} difficulty level.

IMPORTANT INSTRUCTIONS:
- Each question must have exactly 4 options
- Only one option should be correct
- Include clear explanations for why the correct answer is right
- Make questions educational and focused on understanding concepts
- Ensure questions test real knowledge, not just memorization
- Make difficulty appropriate: ${setup.difficulty === 'easy' ? 'basic concepts and definitions' : setup.difficulty === 'medium' ? 'application of concepts and moderate complexity' : 'advanced concepts, analysis, and complex problem-solving'}
- DO NOT include trick questions or ambiguous wording
- Generate unique IDs for each question (use format: q1, q2, q3, etc.)
- Set the topic field to the main topic: "${setup.topic}"

FORMAT: Return a JSON object with a "questions" array containing the questions in the exact schema specified.`;

    // Add study material context if provided
    if (setup.studyMaterial) {
      prompt += `\n\nADDITIONAL CONTEXT from study material:\n${setup.studyMaterial}\n\nUse this material to create more targeted questions, but ensure they still test general understanding of ${setup.topic}.`;
    }

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: quizQuestionsSchema,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    if (!response.text) {
      throw new Error('No response text received from Gemini API');
    }

    const result = JSON.parse(response.text);

    // Persist quiz set (non-breaking: still return questions array)
    try {
      const session = await auth();
      await db.quizSet.create({
        data: {
          userId: session?.user?.id ?? null,
          topic: setup.topic,
          difficulty: setup.difficulty,
          questionCount: setup.questionCount,
          questions: result.questions,
        },
      });
    } catch (e) {
      console.warn('Failed to persist quiz set:', e);
    }

    return NextResponse.json(result.questions);

  } catch (error) {
    console.error('Error generating quiz questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate quiz questions' },
      { status: 500 }
    );
  }
}
