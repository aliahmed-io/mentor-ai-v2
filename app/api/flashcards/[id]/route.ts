import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store: Map<string, unknown> | undefined = (global as any)['__FLASHCARDS__']
  const cards = store?.get(params.id)
  if (!cards) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ id: params.id, flashcards: cards })
}


