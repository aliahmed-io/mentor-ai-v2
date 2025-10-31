import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/server/auth'
import { db } from '@/server/db'

export async function POST(request: NextRequest) {
  try {
    const { quizSetId, percentage, correct, incorrect, unanswered, total } = await request.json()
    if (
      typeof percentage !== 'number' ||
      typeof correct !== 'number' ||
      typeof incorrect !== 'number' ||
      typeof unanswered !== 'number' ||
      typeof total !== 'number'
    ) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
    }
    const session = await auth()
    const rec = await db.quizScore.create({
      data: {
        userId: session?.user?.id ?? null,
        quizSetId: quizSetId ?? null,
        percentage: Math.round(percentage),
        correct,
        incorrect,
        unanswered,
        total,
      },
    })
    return NextResponse.json({ id: rec.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to save score' }, { status: 500 })
  }
}


