import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { ipo_id, shares_requested } = body as { ipo_id?: string; shares_requested?: number }
    if (!ipo_id) return NextResponse.json({ success: false, error: 'ipo_id required' }, { status: 400 })

    const shares = Number(shares_requested)
    if (!Number.isInteger(shares) || shares < 1) {
      return NextResponse.json({ success: false, error: 'shares_requested must be a positive integer' }, { status: 400 })
    }

    const { data: ipo, error: ipoErr } = await supabase
      .from('ipos')
      .select('id, company_id, initial_price, shares_offered, shares_applied, subscription_deadline, status')
      .eq('id', ipo_id)
      .single()

    if (ipoErr || !ipo) {
      return NextResponse.json({ success: false, error: 'IPO not found' }, { status: 404 })
    }
    if (ipo.status !== 'open') {
      return NextResponse.json({ success: false, error: 'IPO is not open for applications' }, { status: 400 })
    }

    const deadline = new Date(ipo.subscription_deadline).getTime()
    if (Date.now() > deadline) {
      return NextResponse.json({ success: false, error: 'IPO subscription deadline has passed' }, { status: 400 })
    }

    const price = ipo.initial_price ?? 0
    const totalCost = shares * price

    const { data: appUser } = await supabase.from('users').select('cash_balance').eq('id', user.id).single()
    const cash = (appUser as { cash_balance?: number } | null)?.cash_balance ?? 0
    if (cash < totalCost) {
      return NextResponse.json({ success: false, error: 'Insufficient cash balance' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('ipo_applications')
      .select('id')
      .eq('ipo_id', ipo_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: false, error: 'You have already applied to this IPO' }, { status: 400 })
    }

    const { data: company } = await supabase
      .from('companies')
      .select('ticker')
      .eq('id', ipo.company_id)
      .single()
    const ticker = (company as { ticker?: string } | null)?.ticker ?? '?'

    const { data: application, error: appErr } = await supabase
      .from('ipo_applications')
      .insert({
        ipo_id,
        user_id: user.id,
        shares_requested: shares,
        shares_allocated: 0,
        amount_paid: totalCost,
      })
      .select()
      .single()

    if (appErr) return NextResponse.json({ success: false, error: appErr.message }, { status: 500 })

    await supabase
      .from('ipos')
      .update({ shares_applied: (ipo.shares_applied ?? 0) + shares })
      .eq('id', ipo_id)

    await supabase.from('users').update({ cash_balance: cash - totalCost }).eq('id', user.id)

    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'ipo_purchase',
      amount: -totalCost,
      description: `IPO application for ${shares} shares of ${ticker}`,
    })

    return NextResponse.json({ success: true, application })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
