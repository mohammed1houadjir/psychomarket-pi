import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { votes } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    const result = await db
      .select({
        action: votes.action,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(votes)
      .groupBy(votes.action)

    const totals: Record<string, number> = { buy: 0, sell: 0, wait: 0 }
    let total = 0

    for (const row of result) {
      totals[row.action] = row.count
      total += row.count
    }

    const percentages = {
      buy: total > 0 ? Math.round((totals.buy / total) * 100) : 0,
      sell: total > 0 ? Math.round((totals.sell / total) * 100) : 0,
      wait: total > 0 ? Math.round((totals.wait / total) * 100) : 0,
      total,
    }

    return NextResponse.json(percentages)
  } catch (err) {
    console.error('[v0] GET /api/market error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user, action } = body

    if (!user || !['buy', 'sell', 'wait'].includes(action)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    await db.insert(votes).values({
      piUsername: user,
      action,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[v0] POST /api/market error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
