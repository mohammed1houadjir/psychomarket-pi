import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { votes } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'username required' }, { status: 400 })
    }

    const userVotes = await db
      .select()
      .from(votes)
      .where(eq(votes.piUsername, username))
      .orderBy(desc(votes.createdAt))
      .limit(10)

    return NextResponse.json(userVotes)
  } catch (err) {
    console.error('[v0] GET /api/votes error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
