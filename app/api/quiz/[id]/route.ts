import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const set = await db.quizSet.findUnique({ where: { id: params.id } })
  if (!set) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: set.id, topic: set.topic, difficulty: set.difficulty, questionCount: set.questionCount, questions: set.questions })
}


