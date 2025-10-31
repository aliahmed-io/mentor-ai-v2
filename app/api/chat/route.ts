import { generateFromGemini } from '@/lib/chatbot/gemini'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/server/db'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'missing message' }, { status: 400 })
    }

    const s = await db.chatSession.findUnique({ where: { id: sessionId } })
    const history = await db.chatMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' }, take: 16 })
    const historyExcerpt = history
      .slice(-8)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')
    
    const prompt = `You are a helpful assistant. Use the uploaded document and conversation history to answer.

Document:
${(s?.fileText || '').slice(0, 20000)}

Conversation history:
${historyExcerpt}

User: ${message}

Assistant:`

    const answer = await generateFromGemini(prompt)

    // Persist messages and touch session
    await db.$transaction([
      db.chatMessage.create({ data: { sessionId, role: 'user', content: message } }),
      db.chatMessage.create({ data: { sessionId, role: 'assistant', content: answer } }),
      db.chatSession.update({ where: { id: sessionId }, data: { lastActiveAt: new Date() } }),
    ])

    return NextResponse.json({ reply: answer })
  } catch (err: any) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}