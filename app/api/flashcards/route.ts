import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { auth } from '@/server/auth'
import { db } from '@/server/db'

const flashcardsSchema = {
  type: 'object',
  properties: {
    flashcards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          front: { type: 'string' },
          back: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'front', 'back'],
      },
    },
  },
  required: ['flashcards'],
} as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const material: string | undefined = body?.material
    const topic: string | undefined = body?.topic
    const count: number = Math.max(4, Math.min(50, Number(body?.count) || 12))

    if (!material || typeof material !== 'string' || material.trim().length < 20) {
      return NextResponse.json(
        { error: 'Please provide at least ~20 characters of study material.' },
        { status: 400 },
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY environment variable is not set' },
        { status: 500 },
      )
    }

    const client = new GoogleGenAI({ apiKey })

    const prompt = `Create ${count} high‑quality study flashcards${topic ? ` about "${topic}"` : ''} from the material below.

INSTRUCTIONS:
- Use concise, testable facts.
- Prefer one concept per card.
- Make fronts clear prompts (questions or terms). Make backs correct, clear answers.
- Include short tags when helpful (topics, chapters, or concepts).
- Avoid ambiguous or overly long text; keep backs < 280 characters when possible.
- Return JSON using the provided schema, with sequential ids (f1, f2, ...).

MATERIAL:
${material}
`

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: flashcardsSchema as any,
        thinkingConfig: { thinkingBudget: 0 },
      },
    })

    if (!response.text) {
      throw new Error('No response text received from Gemini API')
    }

    const parsed = JSON.parse(response.text)
    const cards = Array.isArray(parsed?.flashcards) ? parsed.flashcards : []

    const session = await auth()
    const set = await db.flashcardSet.create({
      data: {
        userId: session?.user?.id ?? null,
        topic: topic ?? null,
        count,
        cards: {
          create: cards.map((c: any) => ({ front: c.front, back: c.back, tags: c.tags ?? [] })),
        },
      },
      select: { id: true },
    })

    return NextResponse.json({ id: set.id, flashcards: cards })
  } catch (error) {
    console.error('Error generating flashcards:', error)
    return NextResponse.json({ error: 'Failed to generate flashcards' }, { status: 500 })
  }
}


