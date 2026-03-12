import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const isAdmin = (user.app_metadata?.is_admin as boolean) === true
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const { ipo_id } = body as { ipo_id?: string }
    if (!ipo_id) return NextResponse.json({ success: false, error: 'ipo_id required' }, { status: 400 })

    const { data: ipo, error: ipoErr } = await supabase
      .from('ipos')
      .select('id, company_id, initial_price, shares_offered, shares_applied, status')
      .eq('id', ipo_id)
      .single()

    if (ipoErr || !ipo) {
      return NextResponse.json({ success: false, error: 'IPO not found' }, { status: 404 })
    }
    if (ipo.status !== 'open') {
      return NextResponse.json({ success: false, error: 'IPO is not open for allocation' }, { status: 400 })
    }

    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('id, name, ticker, shares_available')
      .eq('id', ipo.company_id)
      .single()

    if (companyErr || !company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
    }

    const { data: applications, error: appErr } = await supabase
      .from('ipo_applications')
      .select('id, user_id, shares_requested')
      .eq('ipo_id', ipo_id)

    if (appErr) return NextResponse.json({ success: false, error: appErr.message }, { status: 500 })
    const apps = applications ?? []

    const totalRequested = apps.reduce((s, a) => s + (a.shares_requested || 0), 0)
    const sharesOffered = ipo.shares_offered ?? 0
    const price = ipo.initial_price ?? 0

    const allocations: { application_id: string; user_id: string; shares_requested: number; shares_allocated: number }[] = []
    if (totalRequested <= sharesOffered) {
      apps.forEach((a) => {
        allocations.push({
          application_id: a.id,
          user_id: a.user_id,
          shares_requested: a.shares_requested ?? 0,
          shares_allocated: a.shares_requested ?? 0,
        })
      })
    } else {
      apps.forEach((a) => {
        const req = a.shares_requested ?? 0
        const allocated = Math.floor((sharesOffered * req) / totalRequested)
        allocations.push({
          application_id: a.id,
          user_id: a.user_id,
          shares_requested: req,
          shares_allocated: allocated,
        })
      })
    }

    const totalAllocated = allocations.reduce((s, x) => s + x.shares_allocated, 0)

    for (const alloc of allocations) {
      if (alloc.shares_allocated <= 0) continue

      const cost = alloc.shares_allocated * price

      const { data: appUser } = await supabase.from('users').select('cash_balance').eq('id', alloc.user_id).single()
      const cash = (appUser as { cash_balance?: number } | null)?.cash_balance ?? 0
      if (cash < cost) continue

      await supabase.from('users').update({ cash_balance: cash - cost }).eq('id', alloc.user_id)

      const { data: existing } = await supabase
        .from('holdings')
        .select('id, quantity, avg_buy_price')
        .eq('user_id', alloc.user_id)
        .eq('company_id', ipo.company_id)
        .maybeSingle()

      if (existing) {
        const newQty = existing.quantity + alloc.shares_allocated
        const newAvg = (existing.quantity * existing.avg_buy_price + cost) / newQty
        await supabase.from('holdings').update({ quantity: newQty, avg_buy_price: newAvg }).eq('id', existing.id)
      } else {
        await supabase.from('holdings').insert({
          user_id: alloc.user_id,
          company_id: ipo.company_id,
          quantity: alloc.shares_allocated,
          avg_buy_price: price,
        })
      }

      await supabase.from('ipo_applications').update({
        shares_allocated: alloc.shares_allocated,
        amount_paid: cost,
      }).eq('id', alloc.application_id)

      await supabase.from('transactions').insert({
        user_id: alloc.user_id,
        type: 'ipo_allocation',
        amount: -cost,
        description: `IPO: ${alloc.shares_allocated} shares of ${company.ticker} @ $${price}`,
      })
    }

    await supabase.from('companies').update({
      shares_available: company.shares_available - totalAllocated,
      is_ipo: false,
    }).eq('id', ipo.company_id)

    await supabase.from('ipos').update({ status: 'allocated' }).eq('id', ipo_id)

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
