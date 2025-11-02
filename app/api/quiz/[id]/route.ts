import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'
import { auth } from '@/server/auth'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const set = await db.quizSet.findUnique({ where: { id: params.id } })
  if (!set) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ id: set.id, topic: set.topic, difficulty: set.difficulty, questionCount: set.questionCount, questions: set.questions })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { topic } = await request.json()
    if (typeof topic !== 'string') return NextResponse.json({ error: 'Invalid topic' }, { status: 400 })
    const existing = await db.quizSet.findUnique({ where: { id: params.id }, select: { id: true, userId: true } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await db.quizSet.update({ where: { id: params.id }, data: { topic } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to rename' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const existing = await db.quizSet.findUnique({ where: { id: params.id }, select: { id: true, userId: true } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await db.quizSet.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete' }, { status: 500 })
  }
}


