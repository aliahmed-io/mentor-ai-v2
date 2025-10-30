import { generateFromGemini } from '@/lib/chatbot/gemini'
import { NextRequest, NextResponse } from 'next/server'

// Global sessions store (in production, use Redis or database)
const sessions = global['__SESSIONS_UPLOAD__'] || (global['__SESSIONS_UPLOAD__'] = new Map())

export async function POST(request: NextRequest) {
  try {
    const { sessionId, message } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'missing message' }, { status: 400 })
    }

    const session = sessions.get(sessionId) || { fileText: '', history: [] }

    // Simple context builder: last 8 messages + file text
    const historyExcerpt = (session.history || [])
      .slice(-8)
      .map((m: any) => `${m.role}: ${m.text}`)
      .join('\n')
    
    const prompt = `You are a helpful assistant. Use the uploaded document and conversation history to answer.

Document:
${(session.fileText || '').slice(0, 20000)}

Conversation history:
${historyExcerpt}

User: ${message}

Assistant:`

    const answer = await generateFromGemini(prompt)

    // Save to history
    session.history = session.history || []
    session.history.push({ role: 'user', text: message })
    session.history.push({ role: 'assistant', text: answer })
    sessions.set(sessionId, session)

    return NextResponse.json({ reply: answer })
  } catch (err: any) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}