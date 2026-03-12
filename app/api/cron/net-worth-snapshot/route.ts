import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: users } = await supabase.from('users').select('id')
  if (!users?.length) {
    return NextResponse.json({ success: true, snapshots_taken: 0 })
  }

  let snapshotsTaken = 0
  const now = new Date().toISOString()

  for (const u of users) {
    const userId = u.id

    const { data: userRow } = await supabase.from('users').select('cash_balance').eq('id', userId).single()
    const cashBalance = Number((userRow as { cash_balance?: number } | null)?.cash_balance ?? 0)

    const { data: holdings } = await supabase
      .from('holdings')
      .select('quantity, companies(current_price)')
      .eq('user_id', userId)

    const holdingsList = (holdings ?? []) as Array<{
      quantity: number
      companies: { current_price: number } | null
    }>

    const portfolioValue = holdingsList.reduce((sum, h) => {
      const price = h.companies?.current_price ?? 0
      return sum + (h.quantity ?? 0) * price
    }, 0)

    const netWorth = cashBalance + portfolioValue

    const { error } = await supabase.from('net_worth_snapshots').insert({
      user_id: userId,
      value: netWorth,
      recorded_at: now,
    })

    if (!error) snapshotsTaken++
  }

  return NextResponse.json({ success: true, snapshots_taken: snapshotsTaken })
}
