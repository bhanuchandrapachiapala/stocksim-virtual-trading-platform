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

    const body = await request.json()
    const { company_id, initial_price, shares_offered, subscription_deadline } = body as {
      company_id?: string
      initial_price?: number
      shares_offered?: number
      subscription_deadline?: string
    }

    if (!company_id) return NextResponse.json({ success: false, error: 'company_id required' }, { status: 400 })

    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .select('id, is_ipo')
      .eq('id', company_id)
      .single()

    if (companyErr || !company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 })
    }
    if (company.is_ipo) {
      return NextResponse.json({ success: false, error: 'Company already in an active IPO' }, { status: 400 })
    }

    const price = Number(initial_price)
    const shares = Number(shares_offered)
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(shares) || shares <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid initial_price and shares_offered required' },
        { status: 400 }
      )
    }

    const deadline = subscription_deadline
      ? new Date(subscription_deadline).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: ipo, error: ipoErr } = await supabase
      .from('ipos')
      .insert({
        company_id,
        initial_price: price,
        shares_offered: Math.floor(shares),
        shares_applied: 0,
        subscription_deadline: deadline,
        status: 'open',
      })
      .select()
      .single()

    if (ipoErr) return NextResponse.json({ success: false, error: ipoErr.message }, { status: 500 })

    await supabase.from('price_history').insert({
      company_id,
      price,
      recorded_at: new Date().toISOString(),
    })

    await supabase.from('companies').update({ is_ipo: true }).eq('id', company_id)

    return NextResponse.json({ success: true, ipo })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
